import React, { useState, useEffect } from 'react';
import { Plus, Minus, Search, Download, Eye, Trash2, User, Phone, MapPin, X, Home, ShoppingCart, Users, TrendingUp, ArrowRight, RotateCcw, Edit, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import * as XLSX from 'xlsx';

const ArbessOrderManager = () => {
  const [currentScreen, setCurrentScreen] = useState('home');
  
  // נתונים שנשמרים ב-localStorage
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [returns, setReturns] = useState([]);
  const [expenses, setExpenses] = useState([]);
  
  // מצבים נוספים
  const [showCustomerHistory, setShowCustomerHistory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [printOrder, setPrintOrder] = useState(null);
  const [viewMode, setViewMode] = useState('dashboard');
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [viewingCustomerId, setViewingCustomerId] = useState(null);
  const [updatingPayment, setUpdatingPayment] = useState(null); // הזמנה שמעדכנים לה תשלום
  const [lastBackupDate, setLastBackupDate] = useState(localStorage.getItem('lastBackupDate') || null);
  const [selectedCustomerInOrders, setSelectedCustomerInOrders] = useState(null); // ⭐ חדש: לקוח נבחר במסך הזמנות
  
  // חודש נוכחי למעקב
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return { month: now.getMonth(), year: now.getFullYear() };
  });

  // טעינת נתונים מ-localStorage בפעם הראשונה
  useEffect(() => {
    try {
      const savedCustomers = localStorage.getItem('arbess_customers');
      const savedOrders = localStorage.getItem('arbess_orders');
      const savedReturns = localStorage.getItem('arbess_returns');
      const savedExpenses = localStorage.getItem('arbess_expenses');
      
      if (savedCustomers) setCustomers(JSON.parse(savedCustomers));
      if (savedOrders) setOrders(JSON.parse(savedOrders));
      if (savedReturns) setReturns(JSON.parse(savedReturns));
      if (savedExpenses) setExpenses(JSON.parse(savedExpenses));
      
      console.log('✅ נתונים נטענו מהשמירה');
    } catch (error) {
      console.error('❌ שגיאה בטעינת נתונים:', error);
    }
  }, []);

  // שמירת לקוחות
  useEffect(() => {
    try {
      localStorage.setItem('arbess_customers', JSON.stringify(customers));
      console.log('💾 לקוחות נשמרו');
    } catch (error) {
      console.error('❌ שגיאה בשמירת לקוחות:', error);
    }
  }, [customers]);

  // שמירת הזמנות
  useEffect(() => {
    if (orders.length === 0 && !localStorage.getItem('arbess_orders')) return;
    try {
      localStorage.setItem('arbess_orders', JSON.stringify(orders));
      console.log('💾 הזמנות נשמרו:', orders.length);
    } catch (error) {
      console.error('❌ שגיאה בשמירת הזמנות:', error);
      alert('שגיאה בשמירת הזמנות');
    }
  }, [orders]);

  // שמירת החזרות
  useEffect(() => {
    if (returns.length === 0 && !localStorage.getItem('arbess_returns')) return;
    try {
      localStorage.setItem('arbess_returns', JSON.stringify(returns));
      console.log('💾 החזרות נשמרו:', returns.length);
    } catch (error) {
      console.error('❌ שגיאה בשמירת החזרות:', error);
      alert('שגיאה בשמירת החזרות');
    }
  }, [returns]);

  // שמירת הוצאות
  useEffect(() => {
    try {
      localStorage.setItem('arbess_expenses', JSON.stringify(expenses));
      console.log('💾 הוצאות נשמרו');
    } catch (error) {
      console.error('❌ שגיאה בשמירת הוצאות:', error);
    }
  }, [expenses]);

  // גיבוי אוטומטי יומי
  useEffect(() => {
    const checkAndBackup = () => {
      const today = new Date().toDateString();
      
      if (lastBackupDate !== today) {
        // בצע גיבוי אוטומטי
        const backupData = {
          customers,
          orders,
          returns,
          expenses,
          backupDate: new Date().toISOString(),
          version: '1.0'
        };
        
        try {
          // שמירה ב-localStorage כגיבוי נוסף
          localStorage.setItem('arbess_last_backup', JSON.stringify(backupData));
          setLastBackupDate(today);
          localStorage.setItem('lastBackupDate', today);
          console.log('📦 גיבוי אוטומטי בוצע:', today);
        } catch (error) {
          console.error('❌ שגיאה בגיבוי אוטומטי:', error);
        }
      }
    };
    
    // בדוק כשהאפליקציה נטענת
    checkAndBackup();
    
    // בדוק כל שעה
    const interval = setInterval(checkAndBackup, 3600000); // כל שעה
    
    return () => clearInterval(interval);
  }, [customers, orders, returns, expenses, lastBackupDate]);

  // פונקציה לגיבוי ידני והורדה
  const downloadBackup = () => {
    const backupData = {
      customers,
      orders,
      returns,
      expenses,
      backupDate: new Date().toISOString(),
      businessName: 'ארבס מובחר',
      version: '1.0'
    };
    
    const dataStr = JSON.stringify(backupData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `arbess_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    alert('✅ גיבוי הורד בהצלחה!\n\nשמור את הקובץ במקום בטוח.');
  };

  // פונקציה לשחזור מגיבוי
  const restoreBackup = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const backupData = JSON.parse(e.target.result);
        
        if (window.confirm('האם אתה בטוח שברצונך לשחזר את הגיבוי?\n\nפעולה זו תחליף את כל הנתונים הקיימים!')) {
          setCustomers(backupData.customers || []);
          setOrders(backupData.orders || []);
          setReturns(backupData.returns || []);
          setExpenses(backupData.expenses || []);
          
          alert('✅ גיבוי שוחזר בהצלחה!\n\nכל הנתונים עודכנו.');
        }
      } catch (error) {
        console.error('❌ שגיאה בשחזור גיבוי:', error);
        alert('❌ שגיאה בשחזור הגיבוי. הקובץ פגום או לא תקין.');
      }
    };
    reader.readAsText(file);
  };

  // פונקציה לעדכון סטטוס הזמנה
  const updateOrderStatus = (orderId, newStatus) => {
    const updatedOrders = orders.map(o => 
      o.id === orderId ? { ...o, status: newStatus, statusUpdatedAt: new Date().toISOString() } : o
    );
    setOrders(updatedOrders);
    
    // שמירה ישירה
    try {
      localStorage.setItem('arbess_orders', JSON.stringify(updatedOrders));
      console.log('✅ סטטוס הזמנה עודכן');
    } catch (error) {
      console.error('❌ שגיאה בעדכון סטטוס:', error);
    }
  };

  // פונקציה לעדכון תשלום נוסף
  const updateOrderPayment = (orderId, additionalPayment, notes) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    
    const newPaid = order.paid + additionalPayment;
    const updatedOrders = orders.map(o => 
      o.id === orderId ? { 
        ...o, 
        paid: newPaid,
        paymentHistory: [
          ...(o.paymentHistory || []),
          {
            amount: additionalPayment,
            date: new Date().toISOString(),
            notes: notes || ''
          }
        ]
      } : o
    );
    
    setOrders(updatedOrders);
    
    // שמירה ישירה
    try {
      localStorage.setItem('arbess_orders', JSON.stringify(updatedOrders));
      console.log('✅ תשלום עודכן');
      alert(`✅ תשלום נוסף נרשם!\n\nסכום: ₪${additionalPayment.toFixed(2)}\nסה"כ שולם: ₪${newPaid.toFixed(2)}\nיתרה: ₪${(order.total - newPaid).toFixed(2)}`);
    } catch (error) {
      console.error('❌ שגיאה בעדכון תשלום:', error);
      alert('❌ שגיאה בשמירת התשלום');
    }
  };

  const PRODUCTS = [
    { id: 'smallBox', name: 'ארבעס - קטן', regularPrice: 5.5, occasionalPrice: 5.5 },
    { id: 'largeBox', name: 'ארבעס - גדול', regularPrice: 10, occasionalPrice: 10 },
    { id: 'bobesBox', name: 'בובעס', regularPrice: 6, occasionalPrice: 6 },
    { id: 'kiloArbess', name: 'קילו ארבעס', regularPrice: 25, occasionalPrice: 30 },
    { id: 'kiloBubes', name: 'קילו בובעס', regularPrice: 30, occasionalPrice: 35 }
  ];

  // קבלת שם החודש בעברית
  const getMonthName = (month) => {
    const months = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
    return months[month];
  };

  // מעבר לחודש הבא
  const nextMonth = () => {
    setSelectedMonth(prev => {
      if (prev.month === 11) {
        return { month: 0, year: prev.year + 1 };
      }
      return { month: prev.month + 1, year: prev.year };
    });
  };

  // מעבר לחודש הקודם
  const prevMonth = () => {
    setSelectedMonth(prev => {
      if (prev.month === 0) {
        return { month: 11, year: prev.year - 1 };
      }
      return { month: prev.month - 1, year: prev.year };
    });
  };

  // חזרה לחודש הנוכחי
  const goToCurrentMonth = () => {
    const now = new Date();
    setSelectedMonth({ month: now.getMonth(), year: now.getFullYear() });
  };

  // סינון נתונים לפי החודש הנבחר
  const getFilteredOrders = () => {
    return orders.filter(o => {
      const orderDate = new Date(o.date);
      return orderDate.getMonth() === selectedMonth.month && 
             orderDate.getFullYear() === selectedMonth.year;
    });
  };

  const getFilteredReturns = () => {
    return returns.filter(r => {
      const returnDate = new Date(r.date);
      return returnDate.getMonth() === selectedMonth.month && 
             returnDate.getFullYear() === selectedMonth.year;
    });
  };

  const getFilteredExpenses = () => {
    return expenses.filter(e => {
      const expenseDate = new Date(e.date);
      return expenseDate.getMonth() === selectedMonth.month && 
             expenseDate.getFullYear() === selectedMonth.year;
    });
  };

  // קומפוננט בוחר חודשים
  const MonthSelector = ({ showStats = false }) => {
    const now = new Date();
    const isCurrentMonth = selectedMonth.month === now.getMonth() && 
                          selectedMonth.year === now.getFullYear();
    
    const monthOrders = getFilteredOrders();
    const monthRevenue = monthOrders.reduce((s, o) => s + o.total, 0);
    const monthExpenses = getFilteredExpenses().reduce((s, e) => s + e.amount, 0);
    const monthProfit = monthRevenue - monthExpenses;

    return (
      <div className="bg-white rounded-xl shadow-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <button onClick={nextMonth} className="p-3 bg-amber-100 rounded-xl hover:bg-amber-200 active:scale-95 min-w-[48px] min-h-[48px]">
            <ChevronRight className="w-6 h-6 text-amber-700" />
          </button>
          
          <div className="text-center flex-1">
            <div className="text-2xl font-bold text-amber-800 mb-1">
              {getMonthName(selectedMonth.month)} {selectedMonth.year}
            </div>
            {!isCurrentMonth && (
              <button onClick={goToCurrentMonth} className="text-sm text-blue-600 underline flex items-center justify-center gap-1 mx-auto">
                <Calendar className="w-4 h-4" />
                חזרה לחודש הנוכחי
              </button>
            )}
          </div>
          
          <button onClick={prevMonth} className="p-3 bg-amber-100 rounded-xl hover:bg-amber-200 active:scale-95 min-w-[48px] min-h-[48px]">
            <ChevronLeft className="w-6 h-6 text-amber-700" />
          </button>
        </div>

        {showStats && (
          <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t">
            <div className="text-center">
              <div className="text-xs text-gray-600 mb-1">הזמנות</div>
              <div className="text-lg font-bold text-blue-600">{monthOrders.length}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-600 mb-1">הכנסות</div>
              <div className="text-lg font-bold text-green-600">₪{monthRevenue.toFixed(0)}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-600 mb-1">רווח</div>
              <div className={`text-lg font-bold ${monthProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ₪{monthProfit.toFixed(0)}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const formatDate = (date) => new Date(date).toLocaleDateString('he-IL');
  
  const calculateCustomerBalance = (customerId) => {
    const customerOrders = orders.filter(o => o.customerId === customerId);
    const customerReturns = returns.filter(r => r.customerId === customerId);
    
    // סה"כ הזמנות
    const totalOrders = customerOrders.reduce((s, o) => s + o.total, 0);
    // סה"כ שולם
    const totalPaid = customerOrders.reduce((s, o) => s + o.paid, 0);
    // סה"כ החזרות (זכות)
    const totalReturns = customerReturns.reduce((s, r) => s + r.total, 0);
    
    // חישוב: שולם - הזמנות + החזרות
    // אם חיובי = יש זכות, אם שלילי = יש חוב
    const balance = totalPaid - totalOrders + totalReturns;
    
    return balance;
  };

  const getAdvancedAnalysis = () => {
    const monthOrders = getFilteredOrders();
    const monthExpenses = getFilteredExpenses();
    const monthReturns = getFilteredReturns();
    
    const lastMonthDate = new Date(selectedMonth.year, selectedMonth.month - 1);
    const lastMonthOrders = orders.filter(o => {
      const d = new Date(o.date);
      return d.getMonth() === lastMonthDate.getMonth() && d.getFullYear() === lastMonthDate.getFullYear();
    });
    const lastMonthExpenses = expenses.filter(e => {
      const d = new Date(e.date);
      return d.getMonth() === lastMonthDate.getMonth() && d.getFullYear() === lastMonthDate.getFullYear();
    });

    const thisMonthRevenue = monthOrders.reduce((s, o) => s + o.total, 0);
    const thisMonthPaid = monthOrders.reduce((s, o) => s + o.paid, 0);
    const thisMonthExpensesTotal = monthExpenses.reduce((s, e) => s + e.amount, 0);
    const thisMonthProfit = thisMonthRevenue - thisMonthExpensesTotal;
    const lastMonthRevenue = lastMonthOrders.reduce((s, o) => s + o.total, 0);
    const lastMonthExpensesTotal = lastMonthExpenses.reduce((s, e) => s + e.amount, 0);
    const lastMonthProfit = lastMonthRevenue - lastMonthExpensesTotal;
    const revenueChange = lastMonthRevenue > 0 ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue * 100) : 0;
    const profitChange = lastMonthProfit > 0 ? ((thisMonthProfit - lastMonthProfit) / lastMonthProfit * 100) : 0;

    const customerAnalysis = customers.map(customer => {
      const customerOrders = monthOrders.filter(o => o.customerId === customer.id);
      const totalRevenue = customerOrders.reduce((s, o) => s + o.total, 0);
      const totalPaid = customerOrders.reduce((s, o) => s + o.paid, 0);
      return { ...customer, ordersCount: customerOrders.length, totalRevenue, totalPaid, debt: totalRevenue - totalPaid };
    }).sort((a, b) => b.totalRevenue - a.totalRevenue).filter(c => c.ordersCount > 0);

    const productAnalysis = {};
    monthOrders.forEach(order => {
      order.items.forEach(item => {
        if (!productAnalysis[item.productName]) productAnalysis[item.productName] = { name: item.productName, totalQuantity: 0, totalRevenue: 0 };
        productAnalysis[item.productName].totalQuantity += item.quantity;
        productAnalysis[item.productName].totalRevenue += item.price * item.quantity;
      });
    });
    const topProducts = Object.values(productAnalysis).sort((a, b) => b.totalRevenue - a.totalRevenue);

    const avgOrderValue = monthOrders.length > 0 ? monthOrders.reduce((s, o) => s + o.total, 0) / monthOrders.length : 0;
    const totalDebt = orders.reduce((s, o) => s + Math.max(0, o.total - o.paid), 0);

    return {
      thisMonth: { revenue: thisMonthRevenue, paid: thisMonthPaid, expenses: thisMonthExpensesTotal, profit: thisMonthProfit, orders: monthOrders.length, returns: monthReturns.length },
      lastMonth: { revenue: lastMonthRevenue, expenses: lastMonthExpensesTotal, profit: lastMonthProfit },
      changes: { revenue: revenueChange, profit: profitChange },
      customers: { total: customers.length, top: customerAnalysis.slice(0, 5), withDebt: customerAnalysis.filter(c => c.debt > 0).length },
      products: { top: topProducts.slice(0, 5) },
      averages: { orderValue: avgOrderValue },
      debt: { total: totalDebt }
    };
  };

  const HomePage = () => (
    <div className="relative h-screen w-full overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-amber-100 via-yellow-50 to-orange-100"></div>
      <div className="relative z-10 flex flex-col items-center justify-center h-full px-4">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🌾</div>
          <h1 className="text-4xl font-bold text-amber-800 mb-3">ארבס מובחר</h1>
          <p className="text-lg text-amber-700">מערכת ניהול מקצועית</p>
        </div>
        <button onClick={() => setCurrentScreen('menu')} className="bg-gradient-to-r from-amber-600 to-orange-600 text-white px-10 py-4 rounded-full text-xl font-bold shadow-xl active:scale-95 flex items-center gap-3">
          היכנס למערכת
          <ArrowRight className="w-6 h-6" />
        </button>
      </div>
    </div>
  );

  const MenuScreen = () => {
    const items = [
      { id: 'newOrder', title: 'הזמנה חדשה', icon: <Plus className="w-10 h-10" />, color: 'from-green-500 to-emerald-600', screen: 'newOrder' },
      { id: 'orders', title: 'הזמנות', icon: <ShoppingCart className="w-10 h-10" />, color: 'from-blue-500 to-indigo-600', screen: 'orders' },
      { id: 'dailySummary', title: 'סיכום יומי ומשלוחים', icon: <div className="text-3xl">📦</div>, color: 'from-teal-500 to-cyan-600', screen: 'dailySummary' },
      { id: 'returns', title: 'החזרות', icon: <RotateCcw className="w-10 h-10" />, color: 'from-cyan-500 to-blue-600', screen: 'returns' },
      { id: 'customers', title: 'לקוחות', icon: <Users className="w-10 h-10" />, color: 'from-purple-500 to-pink-600', screen: 'customers' },
      { id: 'accountant', title: 'רואה חשבון', icon: <div className="text-3xl">📊</div>, color: 'from-emerald-500 to-teal-600', screen: 'accountant' },
      { id: 'reports', title: 'דוחות', icon: <TrendingUp className="w-10 h-10" />, color: 'from-orange-500 to-red-600', screen: 'reports' },
      { id: 'expenses', title: 'הוצאות', icon: <div className="text-3xl">💸</div>, color: 'from-red-500 to-pink-600', screen: 'expenses' }
    ];

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="bg-gradient-to-r from-amber-600 to-orange-600 text-white p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <button onClick={() => setCurrentScreen('home')} className="p-3 hover:bg-white/20 rounded-xl min-w-[48px] min-h-[48px]">
              <Home className="w-6 h-6" />
            </button>
            <h1 className="text-2xl font-bold">🌾 ארבס מובחר</h1>
            <div className="w-[48px]"></div>
          </div>
        </div>
        <div className="p-4 grid grid-cols-2 gap-4">
          {items.map(item => (
            <button 
              key={item.id} 
              onClick={() => {
                if (item.screen === 'newOrder') {
                  setEditingOrder(null);
                }
                if (item.screen === 'orders') {
                  setSelectedCustomerInOrders(null); // ⭐ איפוס לקוח נבחר
                }
                setCurrentScreen(item.screen);
              }} 
              className={`bg-gradient-to-br ${item.color} text-white p-5 rounded-2xl shadow-xl active:scale-95 flex flex-col items-center justify-center gap-3 min-h-[140px]`}
            >
              {item.icon}
              <div className="font-bold">{item.title}</div>
            </button>
          ))}
        </div>
      </div>
    );
  };

  const NewOrderForm = () => {
    const [form, setForm] = useState({ 
      customerId: '', 
      isNewCustomer: true, 
      customerName: '', 
      phone: '', 
      address: '', 
      customerType: 'regular', 
      items: [], 
      paid: '', 
      date: new Date().toISOString().split('T')[0], 
      notes: '', 
      hasDelivery: false, 
      deliveryPrice: 30 
    });
    
    useEffect(() => {
      if (editingOrder && currentScreen === 'newOrder') {
        const customer = customers.find(c => c.id === editingOrder.customerId);
        setForm({
          customerId: editingOrder.customerId,
          isNewCustomer: false,
          customerName: customer?.name || '',
          phone: customer?.phone || '',
          address: customer?.address || '',
          customerType: customer?.type || 'regular',
          items: editingOrder.items.map(item => ({ 
            ...item, 
            id: Date.now() + Math.random(),
            quantity: item.quantity.toString()
          })),
          paid: editingOrder.paid.toString(),
          date: editingOrder.date,
          notes: editingOrder.notes || '',
          hasDelivery: editingOrder.hasDelivery || false,
          deliveryPrice: editingOrder.deliveryPrice || 30
        });
      }
    }, [editingOrder, currentScreen]);

    const addItem = (productId) => {
      const product = PRODUCTS.find(p => p.id === productId);
      const price = form.customerType === 'regular' ? product.regularPrice : product.occasionalPrice;
      setForm(p => ({ 
        ...p, 
        items: [...p.items, { 
          id: Date.now() + Math.random(), 
          productId, 
          productName: product.name, 
          quantity: '1', 
          price 
        }] 
      }));
    };
    
    const updateQty = (id, qty) => {
      const qtyValue = qty === '' ? '' : qty;
      setForm(p => ({ 
        ...p, 
        items: p.items.map(i => i.id === id ? { ...i, quantity: qtyValue } : i)
      }));
    };
    
    // כפתורי +/- לכמות
    const incrementQty = (id) => {
      setForm(p => ({ 
        ...p, 
        items: p.items.map(i => {
          if (i.id === id) {
            const currentQty = parseInt(i.quantity) || 0;
            return { ...i, quantity: (currentQty + 1).toString() };
          }
          return i;
        })
      }));
    };
    
    const decrementQty = (id) => {
      setForm(p => ({ 
        ...p, 
        items: p.items.map(i => {
          if (i.id === id) {
            const currentQty = parseInt(i.quantity) || 0;
            if (currentQty > 1) {
              return { ...i, quantity: (currentQty - 1).toString() };
            }
          }
          return i;
        })
      }));
    };
    
    const updatePrice = (id, price) => {
      const numPrice = parseFloat(price);
      if (price === '' || price === null) {
        setForm(p => ({ ...p, items: p.items.map(i => i.id === id ? { ...i, price: '' } : i) }));
      } else if (!isNaN(numPrice) && numPrice >= 0) {
        setForm(p => ({ ...p, items: p.items.map(i => i.id === id ? { ...i, price: numPrice } : i) }));
      }
    };
    
    const removeItem = (id) => {
      setForm(p => ({ ...p, items: p.items.filter(i => i.id !== id) }));
    };
    
    const total = form.items.reduce((s, i) => {
      const itemPrice = i.price === '' ? 0 : parseFloat(i.price) || 0;
      const itemQty = i.quantity === '' ? 0 : parseInt(i.quantity) || 0;
      return s + (itemPrice * itemQty);
    }, 0);
    
    const deliveryCost = form.hasDelivery ? (parseFloat(form.deliveryPrice) || 0) : 0;
    const grandTotal = total + deliveryCost;

    const submit = () => {
      if (!form.items.length) return alert('הוסף פריטים');
      
      const hasEmptyPrice = form.items.some(i => i.price === '' || i.price === null);
      if (hasEmptyPrice) return alert('יש פריטים ללא מחיר. אנא מלא את כל המחירים');
      
      const hasEmptyQty = form.items.some(i => i.quantity === '' || i.quantity === null || parseInt(i.quantity) <= 0);
      if (hasEmptyQty) return alert('יש פריטים עם כמות לא תקינה. אנא מלא כמות לכל הפריטים');
      
      let cId = form.customerId;
      let cName = form.customerName;
      
      if (form.isNewCustomer) {
        if (!cName.trim()) return alert('הזן שם');
        const nc = { 
          id: Date.now().toString(), 
          name: cName, 
          phone: form.phone, 
          address: form.address, 
          type: form.customerType, 
          createdAt: new Date().toISOString() 
        };
        const updatedCustomers = [...customers, nc];
        setCustomers(updatedCustomers);
        
        // שמירה ישירה של הלקוח החדש
        try {
          localStorage.setItem('arbess_customers', JSON.stringify(updatedCustomers));
          console.log('✅ לקוח חדש נשמר ל-localStorage!');
        } catch (error) {
          console.error('❌ שגיאה בשמירת לקוח:', error);
        }
        
        cId = nc.id;
      } else {
        if (!cId) return alert('בחר לקוח');
        cName = customers.find(c => c.id === cId)?.name || '';
      }
      
      // Convert quantities to numbers before saving
      const itemsWithNumbers = form.items.map(i => ({
        productId: i.productId,
        productName: i.productName,
        price: parseFloat(i.price) || 0,
        quantity: parseInt(i.quantity) || 0
      }));
      
      const previousBalance = editingOrder ? editingOrder.previousBalance : calculateCustomerBalance(cId);
      
      const orderData = { 
        id: editingOrder ? editingOrder.id : Date.now().toString(),
        customerId: cId, 
        customerName: cName, 
        items: itemsWithNumbers, 
        total: grandTotal, 
        itemsTotal: total,
        hasDelivery: form.hasDelivery,
        deliveryPrice: form.hasDelivery ? (parseFloat(form.deliveryPrice) || 0) : 0,
        paid: parseFloat(form.paid) || 0, 
        previousBalance, 
        date: form.date, 
        notes: form.notes, 
        createdAt: editingOrder ? editingOrder.createdAt : new Date().toISOString(),
        updatedAt: editingOrder ? new Date().toISOString() : undefined
      };
      
      console.log('💾 שומר הזמנה:', orderData);
      
      let updatedOrders;
      if (editingOrder) {
        updatedOrders = orders.map(o => o.id === editingOrder.id ? orderData : o);
        setOrders(updatedOrders);
      } else {
        updatedOrders = [...orders, orderData];
        setOrders(updatedOrders);
      }
      
      // שמירה ישירה ל-localStorage - חובה!
      try {
        localStorage.setItem('arbess_orders', JSON.stringify(updatedOrders));
        console.log('✅ הזמנה נשמרה ל-localStorage!', updatedOrders.length, 'הזמנות');
      } catch (error) {
        console.error('❌ שגיאה בשמירה:', error);
        alert('שגיאה בשמירת ההזמנה! נסה שוב.');
        return;
      }
      
      // Show invoice after saving
      setPrintOrder(orderData);
      setEditingOrder(null);
      
      // חזרה למסך הראשי אחרי השמירה
      setTimeout(() => {
        setCurrentScreen('menu');
      }, 100);
      
      setForm({ 
        customerId: '', 
        isNewCustomer: true, 
        customerName: '', 
        phone: '', 
        address: '', 
        customerType: 'regular', 
        items: [], 
        paid: '', 
        date: new Date().toISOString().split('T')[0], 
        notes: '', 
        hasDelivery: false, 
        deliveryPrice: 30 
      });
      
      alert(`✅ ההזמנה נשמרה בהצלחה!\n\nלקוח: ${cName}\nסה"כ: ₪${grandTotal.toFixed(2)}\nשולם: ₪${(parseFloat(form.paid) || 0).toFixed(2)}`);
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="sticky top-0 bg-gradient-to-r from-green-600 to-emerald-600 text-white p-5 shadow-lg z-10">
          <div className="flex justify-between items-center">
            <button onClick={() => { setCurrentScreen('menu'); setEditingOrder(null); }} className="p-3 min-w-[48px] min-h-[48px]">
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-bold">{editingOrder ? 'ערוך הזמנה' : 'הזמנה חדשה'}</h2>
            <div className="w-[48px]"></div>
          </div>
        </div>

        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <button onClick={() => setForm(p => ({ ...p, isNewCustomer: true }))} className={`p-5 rounded-xl border-2 min-h-[100px] ${form.isNewCustomer ? 'border-green-600 bg-green-50' : 'bg-white'}`}>
              <User className="w-10 h-10 mx-auto mb-2" />
              <div className="font-bold">לקוח חדש</div>
            </button>
            <button onClick={() => setForm(p => ({ ...p, isNewCustomer: false }))} className={`p-5 rounded-xl border-2 min-h-[100px] ${!form.isNewCustomer ? 'border-green-600 bg-green-50' : 'bg-white'}`}>
              <User className="w-10 h-10 mx-auto mb-2" />
              <div className="font-bold">לקוח קיים</div>
            </button>
          </div>

          {form.isNewCustomer ? (
            <div className="space-y-4">
              <input type="text" placeholder="שם לקוח *" value={form.customerName} onChange={e => setForm(p => ({ ...p, customerName: e.target.value }))} className="w-full p-4 border-2 rounded-xl text-right" />
              <input type="tel" placeholder="טלפון" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} className="w-full p-4 border-2 rounded-xl text-right" />
              <input type="text" placeholder="כתובת" value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} className="w-full p-4 border-2 rounded-xl text-right" />
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => setForm(p => ({ ...p, customerType: 'regular' }))} className={`p-4 rounded-xl border-2 ${form.customerType === 'regular' ? 'border-green-600 bg-green-50' : 'bg-white'}`}>קבוע</button>
                <button onClick={() => setForm(p => ({ ...p, customerType: 'occasional' }))} className={`p-4 rounded-xl border-2 ${form.customerType === 'occasional' ? 'border-green-600 bg-green-50' : 'bg-white'}`}>מזדמן</button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <select value={form.customerId} onChange={e => { const c = customers.find(x => x.id === e.target.value); setForm(p => ({ ...p, customerId: e.target.value, customerType: c?.type || 'regular' })); }} className="w-full p-4 border-2 rounded-xl text-right">
                <option value="">בחר לקוח</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.type === 'regular' ? 'קבוע' : 'מזדמן'})</option>)}
              </select>
              
              {/* ⭐ תצוגת חוב/זכות מצטבר */}
              {form.customerId && (() => {
                const currentBalance = calculateCustomerBalance(form.customerId);
                const selectedCustomer = customers.find(c => c.id === form.customerId);
                
                if (currentBalance === 0) return null;
                
                const isDebt = currentBalance < 0;
                const absBalance = Math.abs(currentBalance);
                
                return (
                  <div className={`p-4 rounded-xl border-2 ${isDebt ? 'bg-red-50 border-red-300' : 'bg-green-50 border-green-300'}`}>
                    <div className="flex items-center justify-between">
                      <div className={`text-2xl font-bold ${isDebt ? 'text-red-600' : 'text-green-600'}`}>
                        ₪{absBalance.toFixed(0)}
                      </div>
                      <div className="text-right">
                        <div className={`font-bold text-lg ${isDebt ? 'text-red-700' : 'text-green-700'}`}>
                          {isDebt ? '⚠️ חוב קיים' : '✅ זכות קיימת'}
                        </div>
                        <div className="text-sm text-gray-600">
                          {isDebt 
                            ? 'החוב יצטרף לחשבון' 
                            : 'הזכות תקוזז אוטומטית'
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} className="w-full p-4 border-2 rounded-xl" />
          
          <div className="grid grid-cols-2 gap-3">
            {PRODUCTS.map(pr => { 
              const price = form.customerType === 'regular' ? pr.regularPrice : pr.occasionalPrice; 
              return (
                <button key={pr.id} onClick={() => addItem(pr.id)} className="bg-white p-4 rounded-xl border-2 active:scale-95 text-right min-h-[80px]">
                  <div className="font-bold">{pr.name}</div>
                  <div className="text-green-600 font-bold">₪{price}</div>
                </button>
              ); 
            })}
          </div>

          {form.items.length > 0 && (
            <div className="bg-white rounded-xl p-4 border-2">
              <h3 className="font-bold mb-3 text-right">פריטים</h3>
              {form.items.map(it => {
                const itemPrice = it.price === '' ? 0 : parseFloat(it.price) || 0;
                const itemQty = it.quantity === '' ? 0 : parseInt(it.quantity) || 0;
                const itemTotal = itemPrice * itemQty;
                return (
                  <div key={it.id} className="mb-4 pb-4 border-b last:border-b-0">
                    <div className="flex justify-between items-start mb-3">
                      <button onClick={() => removeItem(it.id)} className="text-red-500 p-2">
                        <Trash2 className="w-6 h-6" />
                      </button>
                      <div className="flex-1 text-right">
                        <div className="font-bold text-lg">{it.productName}</div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      {/* כמות עם כפתורי +/- */}
                      <div>
                        <label className="text-sm text-gray-600 block text-right mb-2">כמות</label>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => incrementQty(it.id)}
                            className="flex-1 bg-green-500 text-white p-4 rounded-xl active:scale-95 min-h-[56px] flex items-center justify-center font-bold text-2xl"
                          >
                            <Plus className="w-6 h-6" />
                          </button>
                          
                          <input 
                            type="number" 
                            min="1"
                            value={it.quantity} 
                            onChange={e => updateQty(it.id, e.target.value)}
                            placeholder="0"
                            className="w-24 p-4 border-2 rounded-xl text-center font-bold text-2xl"
                          />
                          
                          <button 
                            onClick={() => decrementQty(it.id)}
                            className="flex-1 bg-red-500 text-white p-4 rounded-xl active:scale-95 min-h-[56px] flex items-center justify-center font-bold text-2xl"
                          >
                            <Minus className="w-6 h-6" />
                          </button>
                        </div>
                      </div>
                      
                      {/* מחיר - ניתן לשינוי */}
                      <div>
                        <label className="text-sm text-gray-600 block text-right mb-2">💰 מחיר ליחידה (ניתן לעריכה)</label>
                        <input 
                          type="number" 
                          step="0.01"
                          min="0"
                          value={it.price}
                          onChange={e => updatePrice(it.id, e.target.value)}
                          placeholder="0"
                          className="w-full p-4 border-2 border-blue-300 rounded-xl text-center font-bold text-xl bg-blue-50"
                        />
                      </div>
                    </div>
                    
                    <div className="mt-3 bg-green-50 p-3 rounded-lg">
                      <div className="flex justify-between items-center">
                        <div className="text-xl font-bold text-green-600">
                          {it.price === '' || it.quantity === '' ? '₪--' : `₪${itemTotal.toFixed(2)}`}
                        </div>
                        <div className="text-sm text-gray-600">סה"כ פריט</div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div className="flex justify-between pt-3 border-t-2">
                <div className="font-bold text-xl text-green-600">₪{total.toFixed(2)}</div>
                <div className="font-bold">סה"כ מוצרים</div>
              </div>
            </div>
          )}
          
          <div className="bg-white rounded-xl p-4 border-2">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <input 
                  type="checkbox" 
                  id="hasDelivery"
                  checked={form.hasDelivery}
                  onChange={e => setForm(p => ({ ...p, hasDelivery: e.target.checked }))}
                  className="w-6 h-6 accent-green-600"
                />
                <label htmlFor="hasDelivery" className="font-bold text-lg cursor-pointer">🚚 משלוח</label>
              </div>
            </div>
            
            {form.hasDelivery && (
              <div>
                <label className="text-sm text-gray-600 block text-right mb-2">עלות משלוח</label>
                <input 
                  type="number" 
                  step="0.01"
                  min="0"
                  value={form.deliveryPrice}
                  onChange={e => setForm(p => ({ ...p, deliveryPrice: e.target.value }))}
                  placeholder="30"
                  className="w-full p-3 border-2 rounded-lg text-center font-bold text-lg"
                />
                <div className="mt-3 bg-blue-50 p-3 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div className="text-xl font-bold text-blue-600">₪{deliveryCost.toFixed(2)}</div>
                    <div className="text-sm text-gray-600">עלות משלוח</div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {form.items.length > 0 && (
            <div className="space-y-3">
              {/* סה"כ מוצרים ומשלוח */}
              <div className="bg-white rounded-xl p-4 border-2">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="text-lg font-bold text-gray-700">₪{total.toFixed(2)}</div>
                    <div className="text-gray-600">סה"כ מוצרים:</div>
                  </div>
                  {form.hasDelivery && (
                    <div className="flex justify-between items-center">
                      <div className="text-lg font-bold text-blue-600">₪{deliveryCost.toFixed(2)}</div>
                      <div className="text-gray-600">משלוח:</div>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-2 border-t-2">
                    <div className="text-xl font-bold text-green-600">₪{grandTotal.toFixed(2)}</div>
                    <div className="font-bold text-gray-700">סה"כ הזמנה זו:</div>
                  </div>
                </div>
              </div>
              
              {/* חוב/זכות מצטבר */}
              {!form.isNewCustomer && form.customerId && (() => {
                const currentBalance = calculateCustomerBalance(form.customerId);
                const isDebt = currentBalance < 0;
                const absBalance = Math.abs(currentBalance);
                const finalTotal = grandTotal + currentBalance; // אם יש חוב (שלילי) זה מוסיף, אם זכות (חיובי) זה מפחית
                
                if (currentBalance === 0) return null;
                
                return (
                  <div className={`rounded-xl p-4 border-2 ${isDebt ? 'bg-red-50 border-red-300' : 'bg-blue-50 border-blue-300'}`}>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className={`text-lg font-bold ${isDebt ? 'text-red-600' : 'text-blue-600'}`}>
                          {isDebt ? '-' : '+'}₪{absBalance.toFixed(2)}
                        </div>
                        <div className="text-gray-600">
                          {isDebt ? 'חוב קודם:' : 'זכות קודמת:'}
                        </div>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t">
                        <div className={`text-2xl font-bold ${finalTotal > 0 ? 'text-green-700' : 'text-orange-600'}`}>
                          ₪{Math.abs(finalTotal).toFixed(2)}
                        </div>
                        <div className="font-bold text-gray-700">
                          {finalTotal > 0 ? 'סה"כ לתשלום:' : 'זכות חדשה:'}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
              
              {/* סיכום סופי */}
              <div className="bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl p-5 border-2 border-green-300">
                <div className="flex justify-between items-center">
                  <div className="text-3xl font-bold text-green-700">
                    ₪{(() => {
                      if (!form.isNewCustomer && form.customerId) {
                        const currentBalance = calculateCustomerBalance(form.customerId);
                        const finalTotal = grandTotal + currentBalance;
                        return Math.max(0, finalTotal).toFixed(2); // לא להציג מספר שלילי
                      }
                      return grandTotal.toFixed(2);
                    })()}
                  </div>
                  <div className="font-bold text-xl text-green-700">סה"כ לגבייה</div>
                </div>
              </div>
            </div>
          )}

          <input type="number" step="0.01" placeholder="סכום ששולם" value={form.paid} onChange={e => setForm(p => ({ ...p, paid: e.target.value }))} className="w-full p-4 border-2 rounded-xl text-right" />
          <textarea placeholder="הערות" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} className="w-full p-4 border-2 rounded-xl text-right h-28" />
          <button onClick={submit} className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-5 rounded-xl font-bold shadow-lg active:scale-95">
            {editingOrder ? 'עדכן הזמנה' : 'שמור הזמנה'}
          </button>
        </div>
      </div>
    );
  };

  const OrdersScreen = () => {
    // ⭐ תיקון חדש: אם אין לקוח נבחר - מציג רשימת לקוחות
    if (!selectedCustomerInOrders) {
      // קבלת לקוחות עם הזמנות בחודש הנוכחי
      const customersWithOrders = customers.filter(customer => {
        const customerOrders = getFilteredOrders().filter(o => o.customerId === customer.id);
        return customerOrders.length > 0;
      }).map(customer => {
        const customerOrders = getFilteredOrders().filter(o => o.customerId === customer.id);
        const totalOrders = customerOrders.length;
        const totalRevenue = customerOrders.reduce((sum, o) => sum + o.total, 0);
        const totalPaid = customerOrders.reduce((sum, o) => sum + o.paid, 0);
        const balance = totalRevenue - totalPaid;
        
        return {
          ...customer,
          totalOrders,
          totalRevenue,
          totalPaid,
          balance
        };
      }).filter(customer => {
        if (!searchTerm) return true;
        return customer.name.includes(searchTerm) || customer.phone.includes(searchTerm);
      });

      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-5 shadow-lg sticky top-0 z-10">
            <div className="flex items-center justify-between mb-3">
              <button onClick={() => setCurrentScreen('menu')} className="p-3 hover:bg-white/20 rounded-xl min-w-[48px] min-h-[48px]">
                <X className="w-6 h-6" />
              </button>
              <h1 className="text-2xl font-bold">הזמנות - לקוחות</h1>
              <div className="w-[48px]"></div>
            </div>
            <div className="relative">
              <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input 
                type="text" 
                placeholder="חיפוש לפי שם או טלפון..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-3 pr-12 rounded-xl text-gray-800"
              />
            </div>
          </div>

          <div className="p-4">
            <MonthSelector showStats={true} />
            
            <div className="space-y-3">
              {customersWithOrders.length === 0 ? (
                <div className="bg-white rounded-xl p-8 text-center text-gray-500">
                  {searchTerm ? 'לא נמצאו לקוחות התואמים לחיפוש' : 'אין הזמנות בחודש זה'}
                </div>
              ) : (
                customersWithOrders.map(customer => (
                  <div 
                    key={customer.id} 
                    onClick={() => setSelectedCustomerInOrders(customer.id)}
                    className="bg-white rounded-xl p-4 shadow-lg cursor-pointer hover:shadow-xl active:scale-98 transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="bg-blue-100 rounded-full p-2">
                          <User className="w-6 h-6 text-blue-600" />
                        </div>
                      </div>
                      <div className="flex-1 text-right mr-3">
                        <div className="font-bold text-xl">{customer.name}</div>
                        {customer.phone && (
                          <div className="text-sm text-gray-600">📞 {customer.phone}</div>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 mt-3">
                      <div className="bg-blue-50 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-blue-600">{customer.totalOrders}</div>
                        <div className="text-xs text-gray-600 mt-1">הזמנות</div>
                      </div>
                      <div className="bg-green-50 rounded-lg p-3 text-center">
                        <div className="text-lg font-bold text-green-600">₪{customer.totalRevenue.toFixed(0)}</div>
                        <div className="text-xs text-gray-600 mt-1">סה"כ</div>
                      </div>
                      <div className={`${customer.balance > 0 ? 'bg-red-50' : 'bg-gray-50'} rounded-lg p-3 text-center`}>
                        <div className={`text-lg font-bold ${customer.balance > 0 ? 'text-red-600' : 'text-gray-600'}`}>
                          ₪{Math.abs(customer.balance).toFixed(0)}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">{customer.balance > 0 ? 'חוב' : 'יתרה'}</div>
                      </div>
                    </div>
                    
                    <div className="mt-3 flex items-center justify-center text-blue-600 text-sm font-bold">
                      לחץ לצפייה בהזמנות
                      <ArrowRight className="w-4 h-4 mr-2" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      );
    }

    // ⭐ אם יש לקוח נבחר - מציג את ההזמנות שלו
    const selectedCustomer = customers.find(c => c.id === selectedCustomerInOrders);
    const filteredOrders = getFilteredOrders()
      .filter(order => order.customerId === selectedCustomerInOrders)
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    const handleEdit = (order) => {
      setEditingOrder(order);
      setCurrentScreen('newOrder');
    };

    const handleDelete = (orderId) => {
      if (window.confirm('האם אתה בטוח שברצונך למחוק הזמנה זו?')) {
        const updatedOrders = orders.filter(o => o.id !== orderId);
        setOrders(updatedOrders);
        
        // שמירה ישירה ל-localStorage
        try {
          localStorage.setItem('arbess_orders', JSON.stringify(updatedOrders));
          console.log('✅ הזמנה נמחקה ונשמר ל-localStorage!', updatedOrders.length, 'הזמנות');
          alert('ההזמנה נמחקה בהצלחה');
        } catch (error) {
          console.error('❌ שגיאה בשמירה אחרי מחיקה:', error);
          alert('שגיאה במחיקת ההזמנה');
        }
      }
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-5 shadow-lg sticky top-0 z-10">
          <div className="flex items-center justify-between mb-3">
            <button 
              onClick={() => setSelectedCustomerInOrders(null)} 
              className="p-3 hover:bg-white/20 rounded-xl min-w-[48px] min-h-[48px]"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-bold">{selectedCustomer?.name}</h1>
            <button 
              onClick={() => {
                setSelectedCustomerInOrders(null);
                setCurrentScreen('menu');
              }} 
              className="p-3 hover:bg-white/20 rounded-xl min-w-[48px] min-h-[48px]"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-4">
          <MonthSelector showStats={false} />
          
          {/* ⭐ הצגת חוב/זכות כולל של הלקוח */}
          {(() => {
            const totalBalance = calculateCustomerBalance(selectedCustomerInOrders);
            if (totalBalance === 0) return null;
            
            const isDebt = totalBalance < 0;
            const absBalance = Math.abs(totalBalance);
            
            return (
              <div className={`mb-4 p-5 rounded-xl border-2 ${isDebt ? 'bg-red-50 border-red-300' : 'bg-green-50 border-green-300'}`}>
                <div className="flex items-center justify-between">
                  <div className={`text-3xl font-bold ${isDebt ? 'text-red-600' : 'text-green-600'}`}>
                    ₪{absBalance.toFixed(0)}
                  </div>
                  <div className="text-right">
                    <div className={`font-bold text-xl ${isDebt ? 'text-red-700' : 'text-green-700'}`}>
                      {isDebt ? '⚠️ חוב כולל' : '✅ זכות כוללת'}
                    </div>
                    <div className="text-sm text-gray-600">
                      מכל ההזמנות וההחזרות
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
          
          <div className="space-y-3">{filteredOrders.length === 0 ? (
              <div className="bg-white rounded-xl p-8 text-center text-gray-500">
                אין הזמנות ללקוח זה בחודש הנוכחי
              </div>
            ) : (
              filteredOrders.map(order => {
                const customer = customers.find(c => c.id === order.customerId);
                const balance = order.total - order.paid;
                
                // חישוב החזרות להזמנה הזו
                const orderReturns = returns.filter(r => r.orderId === order.id);
                const totalReturned = orderReturns.reduce((sum, r) => sum + r.total, 0);
                const hasReturns = orderReturns.length > 0;
                
                return (
                  <div key={order.id} className="bg-white rounded-xl p-4 shadow-lg">
                    {/* כותרת עם סטטוס */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex gap-2 flex-wrap">
                        <button 
                          onClick={() => handleEdit(order)}
                          className="p-2 bg-blue-100 rounded-lg hover:bg-blue-200 active:scale-95"
                          title="ערוך"
                        >
                          <Edit className="w-5 h-5 text-blue-600" />
                        </button>
                        <button 
                          onClick={() => handleDelete(order.id)}
                          className="p-2 bg-red-100 rounded-lg hover:bg-red-200 active:scale-95"
                          title="מחק"
                        >
                          <Trash2 className="w-5 h-5 text-red-600" />
                        </button>
                        <button 
                          onClick={() => setPrintOrder(order)}
                          className="p-2 bg-green-100 rounded-lg hover:bg-green-200 active:scale-95"
                          title="צפה וחשבונית"
                        >
                          <Eye className="w-5 h-5 text-green-600" />
                        </button>
                        
                        {/* כפתור עדכון תשלום */}
                        {balance > 0 && (
                          <button 
                            onClick={() => setUpdatingPayment(order)}
                            className="px-3 py-2 bg-amber-100 rounded-lg hover:bg-amber-200 active:scale-95 flex items-center gap-1"
                            title="עדכן תשלום"
                          >
                            <span className="text-sm font-bold text-amber-700">💰 עדכן תשלום</span>
                          </button>
                        )}
                        
                        {/* כפתור שינוי סטטוס */}
                        {order.hasDelivery && (
                          <button 
                            onClick={() => {
                              const newStatus = order.status === 'completed' ? 'pending' : 'completed';
                              updateOrderStatus(order.id, newStatus);
                            }}
                            className={`px-3 py-2 rounded-lg active:scale-95 flex items-center gap-1 ${
                              order.status === 'completed' 
                                ? 'bg-green-100 hover:bg-green-200' 
                                : 'bg-gray-100 hover:bg-gray-200'
                            }`}
                            title={order.status === 'completed' ? 'סמן כממתין' : 'סמן כבוצע'}
                          >
                            <span className="text-sm font-bold">
                              {order.status === 'completed' ? '✅ בוצע' : '⏳ ממתין'}
                            </span>
                          </button>
                        )}
                      </div>
                      
                      <div className="text-right flex-1">
                        <div className="text-sm text-gray-600">{formatDate(order.date)}</div>
                        
                        {/* סטטוס משלוח */}
                        {order.hasDelivery && (
                          <div className={`text-xs mt-1 flex items-center gap-1 justify-end font-bold ${
                            order.status === 'completed' ? 'text-green-600' : 'text-orange-600'
                          }`}>
                            <span>{order.status === 'completed' ? '✅ משלוח הושלם' : '🚚 ממתין למשלוח'}</span>
                          </div>
                        )}
                        
                        {hasReturns && (
                          <div className="text-xs text-orange-600 mt-1 flex items-center gap-1 justify-end">
                            <span>🔄 יש החזרות</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="border-t pt-3 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-bold">₪{order.total.toFixed(2)}</span>
                        <span className="text-gray-600">סה"כ:</span>
                      </div>
                      <div className="flex justify-between text-sm text-green-600">
                        <span className="font-bold">₪{order.paid.toFixed(2)}</span>
                        <span>שולם:</span>
                      </div>
                      {hasReturns && (
                        <div className="flex justify-between text-sm text-orange-600">
                          <span className="font-bold">-₪{totalReturned.toFixed(2)}</span>
                          <span>הוחזר:</span>
                        </div>
                      )}
                      {balance !== 0 && (
                        <div className={`flex justify-between text-sm font-bold ${balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          <span>₪{Math.abs(balance).toFixed(2)}</span>
                          <span>{balance > 0 ? 'חוב:' : 'זכות:'}</span>
                        </div>
                      )}
                    </div>
                    
                    {order.items.length > 0 && (
                      <div className="mt-3 pt-3 border-t text-sm text-gray-600">
                        {order.items.map((item, idx) => {
                          // חישוב כמה הוחזר מהפריט הזה
                          const returnedQty = orderReturns.reduce((total, returnItem) => {
                            const returnedItem = returnItem.items.find(i => i.productId === item.productId);
                            return total + (returnedItem ? returnedItem.quantity : 0);
                          }, 0);
                          
                          return (
                            <div key={idx} className="flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <span>{item.quantity}x</span>
                                {returnedQty > 0 && (
                                  <span className="text-xs text-orange-600">
                                    (הוחזר: {returnedQty})
                                  </span>
                                )}
                              </div>
                              <span>{item.productName}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    
                    {/* פירוט החזרות */}
                    {hasReturns && (
                      <div className="mt-3 pt-3 border-t">
                        <div className="text-xs font-bold text-orange-600 mb-2 text-right">
                          החזרות להזמנה זו:
                        </div>
                        {orderReturns.map((ret, idx) => (
                          <div key={idx} className="text-xs text-gray-600 bg-orange-50 p-2 rounded mb-1">
                            <div className="flex justify-between">
                              <span>-₪{ret.total.toFixed(2)}</span>
                              <span>{formatDate(ret.date)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    );
  };

  const DailySummaryScreen = () => {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    
    const dateOrders = orders.filter(o => o.date === selectedDate);
    const dateDeliveries = dateOrders.filter(o => o.hasDelivery);
    
    // חישוב סיכום מוצרים
    const productSummary = {};
    dateOrders.forEach(order => {
      order.items.forEach(item => {
        if (!productSummary[item.productName]) {
          productSummary[item.productName] = { quantity: 0, productId: item.productId };
        }
        productSummary[item.productName].quantity += item.quantity;
      });
    });

    const dateRevenue = dateOrders.reduce((s, o) => s + o.total, 0);
    const datePaid = dateOrders.reduce((s, o) => s + o.paid, 0);

    const sendToWhatsApp = () => {
      if (dateDeliveries.length === 0) {
        alert('אין משלוחים לתאריך זה');
        return;
      }

      // בניית הודעה לוואטסאפ
      let message = `🚚 *משלוחים ל-${formatDate(selectedDate)}*\n`;
      message += `━━━━━━━━━━━━━━━━\n\n`;
      
      // סיכום מוצרים
      message += `📦 *סיכום מוצרים:*\n`;
      Object.entries(productSummary).forEach(([productName, data]) => {
        message += `   ${productName}: ${data.quantity}\n`;
      });
      message += `\n━━━━━━━━━━━━━━━━\n\n`;
      
      // רשימת משלוחים
      dateDeliveries.forEach((order, idx) => {
        const customer = customers.find(c => c.id === order.customerId);
        
        // סכום לגבייה בהזמנה הזו = סה"כ - מה ששולם
        const amountToCollect = order.total - order.paid;
        
        message += `${idx + 1}. *${customer?.name}*\n`;
        message += `   📍 ${customer?.address || 'אין כתובת'}\n`;
        message += `   📞 ${customer?.phone || 'אין טלפון'}\n`;
        
        // פריטים בהזמנה
        message += `   📦 פריטים:\n`;
        order.items.forEach(item => {
          message += `      • ${item.productName} x${item.quantity}\n`;
        });
        
        // ⭐ הצגת סכום לגבייה
        if (amountToCollect > 0) {
          message += `   💰 *לגבות: ₪${amountToCollect.toFixed(0)}*\n`;
        } else if (amountToCollect < 0) {
          message += `   ✅ שולם במלואו (זכות: ₪${Math.abs(amountToCollect).toFixed(0)})\n`;
        } else {
          message += `   ✅ שולם במלואו\n`;
        }
        
        if (order.notes) {
          message += `   💬 ${order.notes}\n`;
        }
        message += `\n`;
      });
      
      message += `━━━━━━━━━━━━━━━━\n`;
      message += `סה"כ ${dateDeliveries.length} משלוחים`;

      const phoneNumber = ''; // אפשר להוסיף מספר טלפון דיפולטיבי כאן
      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
      
      window.open(whatsappUrl, '_blank');
    };

    const exportToExcel = () => {
      const data = dateOrders.map(order => {
        const customer = customers.find(c => c.id === order.customerId);
        return {
          'שם לקוח': customer?.name || '',
          'טלפון': customer?.phone || '',
          'כתובת': customer?.address || '',
          'פריטים': order.items.map(i => `${i.productName} x${i.quantity}`).join(', '),
          'סה"כ': order.total,
          'שולם': order.paid,
          'יתרה': order.total - order.paid,
          'משלוח': order.hasDelivery ? 'כן' : 'לא',
          'הערות': order.notes || ''
        };
      });

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'סיכום יומי');
      XLSX.writeFile(wb, `סיכום_יומי_${selectedDate}.xlsx`);
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-50">
        <div className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white p-5 shadow-lg sticky top-0 z-10">
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => setCurrentScreen('menu')} className="p-3 hover:bg-white/20 rounded-xl min-w-[48px] min-h-[48px]">
              <X className="w-6 h-6" />
            </button>
            <h1 className="text-2xl font-bold">סיכום יומי ומשלוחים</h1>
            <button onClick={exportToExcel} className="p-3 hover:bg-white/20 rounded-xl min-w-[48px] min-h-[48px]">
              <Download className="w-6 h-6" />
            </button>
          </div>
          
          {/* בחירת תאריך */}
          <input 
            type="date" 
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full p-3 rounded-xl text-gray-800 font-bold text-center text-lg"
          />
        </div>

        <div className="p-4 space-y-4">
          {/* כותרת התאריך */}
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl p-4 text-center shadow-lg">
            <div className="text-2xl font-bold">{formatDate(selectedDate)}</div>
            <div className="text-sm opacity-90">סיכום יומי</div>
          </div>

          {/* סטטיסטיקות */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-xl p-4 shadow-lg text-center">
              <div className="text-3xl font-bold text-blue-600">{dateOrders.length}</div>
              <div className="text-sm text-gray-600 mt-1">הזמנות</div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-lg text-center">
              <div className="text-3xl font-bold text-purple-600">{dateDeliveries.length}</div>
              <div className="text-sm text-gray-600 mt-1">משלוחים</div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-lg text-center">
              <div className="text-3xl font-bold text-green-600">₪{dateRevenue.toFixed(0)}</div>
              <div className="text-sm text-gray-600 mt-1">הכנסות</div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-lg text-center">
              <div className="text-3xl font-bold text-teal-600">₪{datePaid.toFixed(0)}</div>
              <div className="text-sm text-gray-600 mt-1">שולם</div>
            </div>
          </div>

          {/* סיכום מוצרים */}
          {Object.keys(productSummary).length > 0 && (
            <div className="bg-white rounded-xl p-4 shadow-lg">
              <h2 className="font-bold text-xl mb-4 text-right flex items-center justify-end gap-2">
                <span>סיכום מוצרים</span>
                <span className="text-2xl">📦</span>
              </h2>
              <div className="space-y-3">
                {Object.entries(productSummary).map(([productName, data]) => {
                  const isKilo = productName.includes('קילו');
                  const icon = isKilo ? '⚖️' : '📦';
                  const unit = isKilo ? 'קילו' : 'יח׳';
                  
                  return (
                    <div key={productName} className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 border-r-4 border-amber-500">
                      <div className="flex items-center justify-between">
                        <div className="text-3xl font-bold text-amber-600">{data.quantity}</div>
                        <div className="text-right">
                          <div className="font-bold text-lg">{icon} {productName}</div>
                          <div className="text-sm text-gray-600">{unit}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* כפתור שליחה לוואטסאפ */}
          {dateDeliveries.length > 0 && (
            <button 
              onClick={sendToWhatsApp}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white p-5 rounded-xl font-bold text-xl shadow-xl active:scale-95 flex items-center justify-center gap-3"
            >
              <span className="text-2xl">💬</span>
              שלח רשימת משלוחים לוואטסאפ
              <span className="text-2xl">🚚</span>
            </button>
          )}

          {/* רשימת משלוחים */}
          {dateDeliveries.length > 0 && (
            <div className="bg-white rounded-xl p-4 shadow-lg">
              <h2 className="font-bold text-xl mb-4 text-right flex items-center justify-end gap-2">
                <span>רשימת משלוחים ({dateDeliveries.length})</span>
                <span className="text-2xl">🚚</span>
              </h2>
              <div className="space-y-3">
                {dateDeliveries.map((order, idx) => {
                  const customer = customers.find(c => c.id === order.customerId);
                  return (
                    <div key={order.id} className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4 border-r-4 border-blue-500">
                      <div className="flex items-start justify-between mb-3">
                        <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
                          {idx + 1}
                        </div>
                        <div className="flex-1 text-right mr-3">
                          <div className="font-bold text-lg mb-1">{customer?.name}</div>
                          <div className="text-sm text-gray-600 mb-1">📍 {customer?.address || 'אין כתובת'}</div>
                          <div className="text-sm text-gray-600">📞 {customer?.phone || 'אין טלפון'}</div>
                        </div>
                      </div>

                      {/* פריטים בהזמנה */}
                      <div className="bg-white rounded-lg p-3 mb-3">
                        <div className="font-bold text-sm mb-2 text-right">📦 פריטים:</div>
                        {order.items.map((item, itemIdx) => (
                          <div key={itemIdx} className="flex justify-between text-sm py-1">
                            <span className="font-bold text-blue-600">x{item.quantity}</span>
                            <span>{item.productName}</span>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <a 
                          href={`tel:${customer?.phone}`}
                          className="flex-1 bg-green-500 text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2 active:scale-95 font-bold"
                        >
                          <Phone className="w-5 h-5" />
                          חייג
                        </a>
                        <a 
                          href={`https://waze.com/ul?q=${encodeURIComponent(customer?.address || '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 bg-blue-500 text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2 active:scale-95 font-bold"
                        >
                          <MapPin className="w-5 h-5" />
                          נווט
                        </a>
                      </div>
                      
                      {order.notes && (
                        <div className="mt-3 pt-3 border-t text-sm bg-yellow-50 p-2 rounded">
                          <span className="font-bold">💬 הערות: </span>
                          <span className="text-gray-700">{order.notes}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {dateOrders.length === 0 && (
            <div className="bg-white rounded-xl p-8 text-center text-gray-500">
              <div className="text-6xl mb-4">📭</div>
              <div className="text-xl font-bold mb-2">אין הזמנות לתאריך זה</div>
              <div className="text-sm">בחר תאריך אחר או הוסף הזמנות חדשות</div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const ReturnsScreen = () => {
    const [form, setForm] = useState({
      customerId: '',
      orderId: '',
      items: [],
      date: new Date().toISOString().split('T')[0],
      notes: ''
    });

    // פונקציה לחישוב כמה הוחזר מכל פריט בהזמנה
    const getReturnedQuantity = (orderId, productId) => {
      return returns
        .filter(r => r.orderId === orderId)
        .reduce((total, returnItem) => {
          const item = returnItem.items.find(i => i.productId === productId);
          return total + (item ? item.quantity : 0);
        }, 0);
    };

    // קבלת הזמנות של הלקוח הנבחר
    const customerOrders = form.customerId 
      ? orders.filter(o => o.customerId === form.customerId).sort((a, b) => new Date(b.date) - new Date(a.date))
      : [];

    // קבלת פריטים זמינים להחזרה מההזמנה הנבחרת
    const getAvailableItems = () => {
      if (!form.orderId) return [];
      
      const order = orders.find(o => o.id === form.orderId);
      if (!order) return [];

      return order.items.map(item => {
        const returnedQty = getReturnedQuantity(form.orderId, item.productId);
        const availableQty = item.quantity - returnedQty;
        
        return {
          ...item,
          orderedQuantity: item.quantity,
          returnedQuantity: returnedQty,
          availableQuantity: availableQty
        };
      }).filter(item => item.availableQuantity > 0);
    };

    const filteredReturns = getFilteredReturns()
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    const handleSubmit = (e) => {
      if (e) e.preventDefault();
      console.log('🔵 handleSubmit נקרא!');
      console.log('🔵 form:', form);
      
      if (form.items.length === 0) {
        alert('אנא הוסף לפחות פריט אחד להחזרה');
        return;
      }

      // בדיקה שכל הכמויות תקינות
      const hasInvalidQty = form.items.some(i => {
        const qty = parseInt(i.quantity);
        return i.quantity === '' || i.quantity === null || isNaN(qty) || qty <= 0;
      });
      
      if (hasInvalidQty) {
        alert('אנא מלא כמות תקינה לכל הפריטים');
        return;
      }

      // המרת הכמויות למספרים
      const itemsWithNumbers = form.items.map(i => ({
        ...i,
        quantity: parseInt(i.quantity)
      }));

      const total = itemsWithNumbers.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      const returnData = {
        id: Date.now().toString(),
        customerId: form.customerId,
        orderId: form.orderId,
        items: itemsWithNumbers,
        total,
        date: form.date,
        notes: form.notes
      };

      console.log('💾 שומר החזרה:', returnData);
      
      const newReturns = [...returns, returnData];
      setReturns(newReturns);
      
      // שמירה ישירה ל-localStorage - חובה!
      try {
        localStorage.setItem('arbess_returns', JSON.stringify(newReturns));
        console.log('✅ החזרה נשמרה ל-localStorage!', newReturns.length, 'החזרות');
      } catch (error) {
        console.error('❌ שגיאה בשמירת החזרה:', error);
        alert('שגיאה בשמירת ההחזרה! נסה שוב.');
        return;
      }
      
      // ⭐ ההחזרה משפיעה על החוב/זכות הכללי של הלקוח, לא על ההזמנה עצמה
      // הפונקציה calculateCustomerBalance כבר מטפלת בזה אוטומטית!
      
      // ניקוי הטופס
      setForm({
        customerId: '',
        orderId: '',
        items: [],
        date: new Date().toISOString().split('T')[0],
        notes: ''
      });
      
      const customer = customers.find(c => c.id === returnData.customerId);
      alert(`✅ החזרה נוספה בהצלחה!\n\nלקוח: ${customer?.name}\nסכום: ₪${total.toFixed(2)}\nפריטים: ${itemsWithNumbers.length}`);
      
      // גלילה למעלה כדי לראות את רשימת ההחזרות
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 300);
    };

    const addItemToReturn = (availableItem) => {
      console.log('➕ מוסיף פריט להחזרה:', availableItem);
      const existingItem = form.items.find(item => item.productId === availableItem.productId);
      
      if (existingItem) {
        // המרת הכמות הנוכחית למספר
        const currentQty = existingItem.quantity === '' || existingItem.quantity === null 
          ? 0 
          : parseInt(existingItem.quantity) || 0;
        
        // בדיקה שלא עוברים את הכמות הזמינה
        if (currentQty >= availableItem.availableQuantity) {
          alert(`ניתן להחזיר עד ${availableItem.availableQuantity} יחידות בלבד`);
          return;
        }
        
        setForm({
          ...form,
          items: form.items.map(item => 
            item.productId === availableItem.productId 
              ? { ...item, quantity: currentQty + 1 }
              : item
          )
        });
      } else {
        setForm({
          ...form,
          items: [...form.items, { 
            productId: availableItem.productId, 
            productName: availableItem.productName, 
            price: availableItem.price, 
            quantity: 1,
            maxQuantity: availableItem.availableQuantity
          }]
        });
        console.log('✅ פריט נוסף, סה"כ פריטים:', form.items.length + 1);
      }
    };

    const updateReturnQty = (productId, newQty) => {
      const item = form.items.find(i => i.productId === productId);
      if (!item) return;
      
      // אפשר שדה ריק זמנית בזמן עריכה
      if (newQty === '' || newQty === null) {
        setForm({
          ...form,
          items: form.items.map(i => 
            i.productId === productId ? { ...i, quantity: '' } : i
          )
        });
        return;
      }
      
      const qtyNum = parseInt(newQty);
      
      // בדיקת תקינות
      if (isNaN(qtyNum) || qtyNum < 0) {
        return;
      }
      
      if (qtyNum > item.maxQuantity) {
        alert(`ניתן להחזיר עד ${item.maxQuantity} יחידות בלבד`);
        return;
      }
      
      setForm({
        ...form,
        items: form.items.map(i => 
          i.productId === productId ? { ...i, quantity: qtyNum } : i
        )
      });
    };

    const removeItem = (productId) => {
      setForm({
        ...form,
        items: form.items.filter(item => item.productId !== productId)
      });
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-blue-50">
        <div className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white p-5 shadow-lg sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <button onClick={() => setCurrentScreen('menu')} className="p-3 hover:bg-white/20 rounded-xl min-w-[48px] min-h-[48px]">
              <X className="w-6 h-6" />
            </button>
            <h1 className="text-2xl font-bold">החזרות</h1>
            <div className="w-[48px]"></div>
          </div>
        </div>

        <div className="p-4">
          <MonthSelector showStats={false} />

          <div className="bg-white rounded-xl p-4 shadow-lg mb-4">
            <h2 className="font-bold text-xl mb-4 text-right">החזרה חדשה</h2>
            <div className="space-y-4">
              {/* שלב 1: בחירת לקוח */}
              <div>
                <label className="block text-sm font-bold mb-2 text-right">בחר לקוח:</label>
                <select 
                  value={form.customerId}
                  onChange={(e) => {
                    setForm({
                      customerId: e.target.value,
                      orderId: '',
                      items: [],
                      date: form.date,
                      notes: ''
                    });
                  }}
                  className="w-full p-4 border-2 rounded-xl text-right"
                  required
                >
                  <option value="">בחר לקוח</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>
                  ))}
                </select>
              </div>

              {/* שלב 2: בחירת הזמנה */}
              {form.customerId && customerOrders.length > 0 && (
                <div>
                  <label className="block text-sm font-bold mb-2 text-right">בחר הזמנה:</label>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {customerOrders.map(order => {
                      const orderReturns = returns.filter(r => r.orderId === order.id);
                      const hasReturns = orderReturns.length > 0;
                      
                      return (
                        <button
                          key={order.id}
                          type="button"
                          onClick={() => setForm({
                            ...form,
                            orderId: order.id,
                            items: []
                          })}
                          className={`w-full p-3 rounded-xl border-2 text-right ${
                            form.orderId === order.id 
                              ? 'border-cyan-600 bg-cyan-50' 
                              : 'border-gray-200 bg-white hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="text-xs text-gray-500">{formatDate(order.date)}</div>
                              {hasReturns && (
                                <div className="text-xs text-orange-600 mt-1">
                                  🔄 יש החזרות קיימות
                                </div>
                              )}
                            </div>
                            <div className="text-right">
                              <div className="font-bold">הזמנה #{order.id.slice(-6)}</div>
                              <div className="text-sm text-green-600">₪{order.total.toFixed(2)}</div>
                              <div className="text-xs text-gray-600">{order.items.length} פריטים</div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* שלב 3: בחירת פריטים להחזרה */}
              {form.orderId && getAvailableItems().length > 0 && (
                <div>
                  <label className="block text-sm font-bold mb-2 text-right">פריטים זמינים להחזרה:</label>
                  <div className="space-y-2">
                    {getAvailableItems().map(item => (
                      <button
                        key={item.productId}
                        type="button"
                        onClick={() => addItemToReturn(item)}
                        className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white p-3 rounded-xl shadow-md active:scale-95 text-right"
                      >
                        <div className="flex justify-between items-center">
                          <div className="text-sm">
                            <div>זמינה: {item.availableQuantity}</div>
                            <div className="text-xs opacity-80">
                              הוזמן: {item.orderedQuantity} | הוחזר: {item.returnedQuantity}
                            </div>
                          </div>
                          <div>
                            <div className="font-bold text-lg">{item.productName}</div>
                            <div className="text-sm">₪{item.price.toFixed(2)} ליחידה</div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* אזהרה אם אין פריטים זמינים */}
              {form.orderId && getAvailableItems().length === 0 && (
                <div className="bg-yellow-50 border-r-4 border-yellow-400 p-4 rounded-lg text-right">
                  <div className="font-bold text-yellow-800">⚠️ אין פריטים זמינים להחזרה</div>
                  <div className="text-sm text-yellow-700 mt-1">
                    כל הפריטים בהזמנה זו כבר הוחזרו
                  </div>
                </div>
              )}

              {/* פריטים שנבחרו להחזרה */}
              {form.items.length > 0 && (
                <div>
                  <label className="block text-sm font-bold mb-2 text-right">פריטים להחזרה:</label>
                  <div className="space-y-3">
                    {form.items.map(item => (
                      <div key={item.productId} className="bg-gray-50 p-4 rounded-xl border-2 border-gray-200">
                        <div className="flex items-center justify-between mb-3">
                          <button
                            type="button"
                            onClick={() => removeItem(item.productId)}
                            className="text-red-600 p-2"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                          <div className="text-right flex-1">
                            <div className="font-bold">{item.productName}</div>
                            <div className="text-sm text-gray-600">
                              ₪{item.price.toFixed(2)} ליחידה
                            </div>
                            <div className="text-xs text-orange-600 mt-1">
                              מקסימום: {item.maxQuantity} יחידות
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="font-bold text-lg text-red-600">
                            {item.quantity === '' || item.quantity === null 
                              ? '-₪--' 
                              : `-₪${(item.price * parseInt(item.quantity)).toFixed(2)}`
                            }
                          </div>
                          <div>
                            <label className="text-xs text-gray-600 block text-center mb-1">כמות</label>
                            <input 
                              type="number"
                              min="1"
                              max={item.maxQuantity}
                              value={item.quantity}
                              onChange={(e) => updateReturnQty(item.productId, e.target.value)}
                              className="w-24 p-2 border-2 rounded-lg text-center font-bold"
                              placeholder="0"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4 mt-3">
                    <div className="flex justify-between items-center">
                      <div className="text-2xl font-bold text-red-600">
                        -₪{form.items.reduce((s, i) => {
                          const qty = i.quantity === '' ? 0 : parseInt(i.quantity) || 0;
                          return s + (i.price * qty);
                        }, 0).toFixed(2)}
                      </div>
                      <div className="font-bold text-lg">סה"כ החזרה</div>
                    </div>
                  </div>
                </div>
              )}

              {/* תאריך והערות */}
              {form.items.length > 0 && (
                <>
                  <input 
                    type="date" 
                    value={form.date}
                    onChange={(e) => setForm({...form, date: e.target.value})}
                    className="w-full p-4 border-2 rounded-xl text-right"
                    required
                  />
                  
                  <textarea 
                    placeholder="הערות (אופציונלי)" 
                    value={form.notes}
                    onChange={(e) => setForm({...form, notes: e.target.value})}
                    className="w-full p-4 border-2 rounded-xl text-right"
                    rows="3"
                  />

                  <button 
                    type="button"
                    onClick={handleSubmit}
                    className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 text-white p-5 rounded-xl font-bold text-xl shadow-xl active:scale-95"
                  >
                    ✅ אשר החזרה
                  </button>
                </>
              )}
            </div>
          </div>

          {/* רשימת החזרות קיימות */}
          <div className="space-y-3">
            <h2 className="font-bold text-xl text-right">החזרות בחודש</h2>
            {filteredReturns.length === 0 ? (
              <div className="bg-white rounded-xl p-8 text-center text-gray-500">
                אין החזרות בחודש זה
              </div>
            ) : (
              filteredReturns.map(returnItem => {
                const customer = customers.find(c => c.id === returnItem.customerId);
                const order = orders.find(o => o.id === returnItem.orderId);
                
                return (
                  <div key={returnItem.id} className="bg-white rounded-xl p-4 shadow-lg border-r-4 border-red-500">
                    <div className="text-right mb-3">
                      <div className="font-bold text-lg">{customer?.name}</div>
                      <div className="text-sm text-gray-600">{formatDate(returnItem.date)}</div>
                      {order && (
                        <div className="text-xs text-blue-600 mt-1">
                          מהזמנה: {formatDate(order.date)} | ₪{order.total.toFixed(2)}
                        </div>
                      )}
                    </div>
                    
                    <div className="border-t pt-3 space-y-2">
                      <div className="flex justify-between text-lg font-bold text-red-600">
                        <span>-₪{returnItem.total.toFixed(2)}</span>
                        <span>סה"כ החזרה:</span>
                      </div>
                    </div>
                    
                    {returnItem.items.length > 0 && (
                      <div className="mt-3 pt-3 border-t text-sm text-gray-600">
                        {returnItem.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between">
                            <span>{item.quantity}x</span>
                            <span>{item.productName}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {returnItem.notes && (
                      <div className="mt-3 pt-3 border-t text-sm">
                        <span className="font-bold">הערות: </span>
                        <span className="text-gray-700">{returnItem.notes}</span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    );
  };

  const CustomersScreen = () => {
    const [sortBy, setSortBy] = useState('name');
    
    let sortedCustomers = [...customers];
    if (sortBy === 'name') {
      sortedCustomers.sort((a, b) => a.name.localeCompare(b.name, 'he'));
    } else if (sortBy === 'debt') {
      sortedCustomers.sort((a, b) => {
        const aBalance = calculateCustomerBalance(a.id);
        const bBalance = calculateCustomerBalance(b.id);
        return aBalance - bBalance;
      });
    }

    const filteredCustomers = sortedCustomers.filter(c => 
      c.name.includes(searchTerm) || c.phone.includes(searchTerm)
    );

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-5 shadow-lg sticky top-0 z-10">
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => setCurrentScreen('menu')} className="p-3 hover:bg-white/20 rounded-xl min-w-[48px] min-h-[48px]">
              <X className="w-6 h-6" />
            </button>
            <h1 className="text-2xl font-bold">לקוחות</h1>
            <div className="w-[48px]"></div>
          </div>
          <div className="relative mb-3">
            <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="חיפוש לקוח..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-3 pr-12 rounded-xl text-gray-800"
            />
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setSortBy('name')}
              className={`flex-1 p-2 rounded-lg ${sortBy === 'name' ? 'bg-white text-purple-600' : 'bg-white/20'}`}
            >
              מיון לפי שם
            </button>
            <button 
              onClick={() => setSortBy('debt')}
              className={`flex-1 p-2 rounded-lg ${sortBy === 'debt' ? 'bg-white text-purple-600' : 'bg-white/20'}`}
            >
              מיון לפי יתרה
            </button>
          </div>
        </div>

        <div className="p-4 space-y-3">
          {filteredCustomers.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center text-gray-500">
              {searchTerm ? 'לא נמצאו לקוחות התואמים לחיפוש' : 'אין לקוחות במערכת'}
            </div>
          ) : (
            filteredCustomers.map(customer => {
              const balance = calculateCustomerBalance(customer.id);
              const customerOrders = orders.filter(o => o.customerId === customer.id);
              
              return (
                <div 
                  key={customer.id} 
                  onClick={() => {
                    setViewingCustomerId(customer.id);
                    setCurrentScreen('customerFolder');
                  }}
                  className="bg-white rounded-xl p-4 shadow-lg active:scale-98 cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex gap-2">
                      <a 
                        href={`tel:${customer.phone}`}
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 bg-green-100 rounded-lg hover:bg-green-200 active:scale-95"
                      >
                        <Phone className="w-5 h-5 text-green-600" />
                      </a>
                      <a 
                        href={`https://wa.me/972${customer.phone.replace(/^0/, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 bg-green-100 rounded-lg hover:bg-green-200 active:scale-95"
                      >
                        <span className="text-lg">💬</span>
                      </a>
                    </div>
                    <div className="text-right flex-1">
                      <div className="font-bold text-lg">{customer.name}</div>
                      <div className="text-sm text-gray-600">{customer.phone}</div>
                      {customer.address && (
                        <div className="text-xs text-gray-500 mt-1">{customer.address}</div>
                      )}
                    </div>
                  </div>
                  
                  <div className="border-t pt-3 mt-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-bold">{customerOrders.length}</span>
                      <span className="text-gray-600">הזמנות:</span>
                    </div>
                    {balance !== 0 && (
                      <div className={`flex justify-between text-sm font-bold ${balance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                        <span>₪{Math.abs(balance).toFixed(2)}</span>
                        <span>{balance < 0 ? 'חוב:' : 'זכות:'}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{customer.type === 'regular' ? 'לקוח קבוע' : 'לקוח מזדמן'}</span>
                      <span>סוג:</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  const CustomerFolderScreen = () => {
    const customer = customers.find(c => c.id === viewingCustomerId);
    if (!customer) return null;

    const customerOrders = orders.filter(o => o.customerId === customer.id).sort((a, b) => new Date(b.date) - new Date(a.date));
    const customerReturns = returns.filter(r => r.customerId === customer.id).sort((a, b) => new Date(b.date) - new Date(a.date));
    const balance = calculateCustomerBalance(customer.id);
    const totalRevenue = customerOrders.reduce((s, o) => s + o.total, 0);
    const totalPaid = customerOrders.reduce((s, o) => s + o.paid, 0);

    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-5 shadow-lg sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <button onClick={() => setCurrentScreen('customers')} className="p-3 hover:bg-white/20 rounded-xl min-w-[48px] min-h-[48px]">
              <X className="w-6 h-6" />
            </button>
            <h1 className="text-2xl font-bold">{customer.name}</h1>
            <div className="w-[48px]"></div>
          </div>
        </div>

        <div className="p-4 space-y-4">
          <div className="bg-white rounded-xl p-4 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex gap-2">
                <a 
                  href={`tel:${customer.phone}`}
                  className="p-3 bg-green-500 text-white rounded-xl active:scale-95 flex items-center gap-2"
                >
                  <Phone className="w-5 h-5" />
                  <span>חייג</span>
                </a>
                <a 
                  href={`https://wa.me/972${customer.phone.replace(/^0/, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 bg-green-500 text-white rounded-xl active:scale-95"
                >
                  <span className="text-xl">💬</span>
                </a>
              </div>
              <div className="text-right">
                <div className="font-bold text-lg">{customer.phone}</div>
                {customer.address && (
                  <div className="text-sm text-gray-600">{customer.address}</div>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-3 pt-3 border-t">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{customerOrders.length}</div>
                <div className="text-xs text-gray-600">הזמנות</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">₪{totalRevenue.toFixed(0)}</div>
                <div className="text-xs text-gray-600">סה"כ מכירות</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${balance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                  ₪{Math.abs(balance).toFixed(0)}
                </div>
                <div className="text-xs text-gray-600">{balance < 0 ? 'חוב' : 'זכות'}</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-lg">
            <h2 className="font-bold text-xl mb-4 text-right">הזמנות</h2>
            <div className="space-y-3">
              {customerOrders.length === 0 ? (
                <div className="text-center text-gray-500 py-4">אין הזמנות</div>
              ) : (
                customerOrders.map(order => {
                  const orderBalance = order.total - order.paid;
                  return (
                    <div key={order.id} className="bg-gray-50 rounded-xl p-3">
                      <div className="flex items-center justify-between mb-2">
                        <button 
                          onClick={() => setPrintOrder(order)}
                          className="p-2 bg-blue-100 rounded-lg hover:bg-blue-200 active:scale-95"
                        >
                          <Eye className="w-4 h-4 text-blue-600" />
                        </button>
                        <div className="text-right flex-1">
                          <div className="font-bold">{formatDate(order.date)}</div>
                          <div className="text-sm text-gray-600">₪{order.total.toFixed(2)}</div>
                        </div>
                      </div>
                      {orderBalance !== 0 && (
                        <div className={`text-sm font-bold ${orderBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {orderBalance > 0 ? 'חוב' : 'זכות'}: ₪{Math.abs(orderBalance).toFixed(2)}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {customerReturns.length > 0 && (
            <div className="bg-white rounded-xl p-4 shadow-lg">
              <h2 className="font-bold text-xl mb-4 text-right">החזרות</h2>
              <div className="space-y-3">
                {customerReturns.map(returnItem => (
                  <div key={returnItem.id} className="bg-red-50 rounded-xl p-3 border-r-4 border-red-500">
                    <div className="flex items-center justify-between">
                      <div className="text-red-600 font-bold">-₪{returnItem.total.toFixed(2)}</div>
                      <div className="text-right">
                        <div className="font-bold">{formatDate(returnItem.date)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const ReportsScreen = () => {
    const analysis = getAdvancedAnalysis();

    const exportFullReport = () => {
      const monthOrders = getFilteredOrders();
      const monthExpenses = getFilteredExpenses();
      
      const ordersData = monthOrders.map(order => {
        const customer = customers.find(c => c.id === order.customerId);
        return {
          'תאריך': formatDate(order.date),
          'לקוח': customer?.name || '',
          'טלפון': customer?.phone || '',
          'סה"כ': order.total,
          'שולם': order.paid,
          'יתרה': order.total - order.paid,
          'הערות': order.notes || ''
        };
      });

      const expensesData = monthExpenses.map(expense => ({
        'תאריך': formatDate(expense.date),
        'תיאור': expense.description,
        'סכום': expense.amount,
        'קטגוריה': expense.category || ''
      }));

      const summaryData = [{
        'הכנסות': analysis.thisMonth.revenue,
        'הוצאות': analysis.thisMonth.expenses,
        'רווח': analysis.thisMonth.profit,
        'הזמנות': analysis.thisMonth.orders
      }];

      const wb = XLSX.utils.book_new();
      const wsOrders = XLSX.utils.json_to_sheet(ordersData);
      const wsExpenses = XLSX.utils.json_to_sheet(expensesData);
      const wsSummary = XLSX.utils.json_to_sheet(summaryData);
      
      XLSX.utils.book_append_sheet(wb, wsSummary, 'סיכום');
      XLSX.utils.book_append_sheet(wb, wsOrders, 'הזמנות');
      XLSX.utils.book_append_sheet(wb, wsExpenses, 'הוצאות');
      
      const monthName = getMonthName(selectedMonth.month);
      XLSX.writeFile(wb, `דוח_מלא_${monthName}_${selectedMonth.year}.xlsx`);
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
        <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white p-5 shadow-lg sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <button onClick={() => setCurrentScreen('menu')} className="p-3 hover:bg-white/20 rounded-xl min-w-[48px] min-h-[48px]">
              <X className="w-6 h-6" />
            </button>
            <h1 className="text-2xl font-bold">דוחות</h1>
            <button onClick={exportFullReport} className="p-3 hover:bg-white/20 rounded-xl min-w-[48px] min-h-[48px]">
              <Download className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          <MonthSelector showStats={false} />

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-xl p-4 shadow-lg text-center">
              <div className="text-3xl font-bold text-green-600">₪{analysis.thisMonth.revenue.toFixed(0)}</div>
              <div className="text-sm text-gray-600 mt-1">הכנסות</div>
              {analysis.changes.revenue !== 0 && (
                <div className={`text-xs mt-2 ${analysis.changes.revenue >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {analysis.changes.revenue >= 0 ? '↑' : '↓'} {Math.abs(analysis.changes.revenue).toFixed(1)}%
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl p-4 shadow-lg text-center">
              <div className="text-3xl font-bold text-red-600">₪{analysis.thisMonth.expenses.toFixed(0)}</div>
              <div className="text-sm text-gray-600 mt-1">הוצאות</div>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-lg text-center">
              <div className={`text-3xl font-bold ${analysis.thisMonth.profit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                ₪{analysis.thisMonth.profit.toFixed(0)}
              </div>
              <div className="text-sm text-gray-600 mt-1">רווח</div>
              {analysis.changes.profit !== 0 && (
                <div className={`text-xs mt-2 ${analysis.changes.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {analysis.changes.profit >= 0 ? '↑' : '↓'} {Math.abs(analysis.changes.profit).toFixed(1)}%
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl p-4 shadow-lg text-center">
              <div className="text-3xl font-bold text-purple-600">{analysis.thisMonth.orders}</div>
              <div className="text-sm text-gray-600 mt-1">הזמנות</div>
            </div>
          </div>

          {analysis.customers.top.length > 0 && (
            <div className="bg-white rounded-xl p-4 shadow-lg">
              <h2 className="font-bold text-xl mb-4 text-right">לקוחות מובילים בחודש</h2>
              <div className="space-y-3">
                {analysis.customers.top.map((customer, idx) => (
                  <div key={customer.id} className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-3">
                    <div className="flex items-center justify-between">
                      <div className="text-purple-600 font-bold text-lg">#{idx + 1}</div>
                      <div className="text-right flex-1 mx-3">
                        <div className="font-bold">{customer.name}</div>
                        <div className="text-sm text-gray-600">{customer.ordersCount} הזמנות</div>
                      </div>
                      <div className="text-left">
                        <div className="text-lg font-bold text-green-600">₪{customer.totalRevenue.toFixed(0)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {analysis.products.top.length > 0 && (
            <div className="bg-white rounded-xl p-4 shadow-lg">
              <h2 className="font-bold text-xl mb-4 text-right">מוצרים מובילים בחודש</h2>
              <div className="space-y-3">
                {analysis.products.top.map((product, idx) => (
                  <div key={idx} className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-3">
                    <div className="flex items-center justify-between">
                      <div className="text-amber-600 font-bold text-lg">#{idx + 1}</div>
                      <div className="text-right flex-1 mx-3">
                        <div className="font-bold">{product.name}</div>
                        <div className="text-sm text-gray-600">{product.totalQuantity} יחידות</div>
                      </div>
                      <div className="text-left">
                        <div className="text-lg font-bold text-green-600">₪{product.totalRevenue.toFixed(0)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {analysis.debt.total > 0 && (
            <div className="bg-red-50 border-r-4 border-red-500 rounded-xl p-4 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-red-600">₪{analysis.debt.total.toFixed(0)}</div>
                <div className="text-right">
                  <div className="font-bold text-lg">סה"כ חובות</div>
                  <div className="text-sm text-gray-600">{analysis.customers.withDebt} לקוחות עם חוב</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const ExpensesScreen = () => {
    const [form, setForm] = useState({
      description: '',
      amount: '',
      category: '',
      date: new Date().toISOString().split('T')[0]
    });

    const filteredExpenses = getFilteredExpenses()
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    
    const totalExpenses = filteredExpenses.reduce((s, e) => s + e.amount, 0);

    const handleSubmit = (e) => {
      e.preventDefault();
      
      const expenseData = {
        id: Date.now().toString(),
        description: form.description,
        amount: parseFloat(form.amount),
        category: form.category,
        date: form.date
      };

      setExpenses([...expenses, expenseData]);
      setForm({
        description: '',
        amount: '',
        category: '',
        date: new Date().toISOString().split('T')[0]
      });
      alert('הוצאה נוספה בהצלחה! ✅');
    };

    const handleDelete = (expenseId) => {
      if (window.confirm('האם אתה בטוח שברצונך למחוק הוצאה זו?')) {
        setExpenses(expenses.filter(e => e.id !== expenseId));
        alert('ההוצאה נמחקה בהצלחה');
      }
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50">
        <div className="bg-gradient-to-r from-red-600 to-pink-600 text-white p-5 shadow-lg sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <button onClick={() => setCurrentScreen('menu')} className="p-3 hover:bg-white/20 rounded-xl min-w-[48px] min-h-[48px]">
              <X className="w-6 h-6" />
            </button>
            <h1 className="text-2xl font-bold">הוצאות</h1>
            <div className="w-[48px]"></div>
          </div>
        </div>

        <div className="p-4 space-y-4">
          <MonthSelector showStats={false} />

          <div className="bg-white rounded-xl p-4 shadow-lg text-center">
            <div className="text-4xl font-bold text-red-600">₪{totalExpenses.toFixed(0)}</div>
            <div className="text-sm text-gray-600 mt-1">סה"כ הוצאות בחודש</div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-lg">
            <h2 className="font-bold text-xl mb-4 text-right">הוצאה חדשה</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input 
                type="text" 
                placeholder="תיאור ההוצאה" 
                value={form.description}
                onChange={(e) => setForm({...form, description: e.target.value})}
                className="w-full p-4 border-2 rounded-xl text-right"
                required
              />
              <input 
                type="number" 
                placeholder="סכום" 
                value={form.amount}
                onChange={(e) => setForm({...form, amount: e.target.value})}
                className="w-full p-4 border-2 rounded-xl text-right"
                step="0.01"
                required
              />
              <input 
                type="text" 
                placeholder="קטגוריה (אופציונלי)" 
                value={form.category}
                onChange={(e) => setForm({...form, category: e.target.value})}
                className="w-full p-4 border-2 rounded-xl text-right"
              />
              <input 
                type="date" 
                value={form.date}
                onChange={(e) => setForm({...form, date: e.target.value})}
                className="w-full p-4 border-2 rounded-xl text-right"
                required
              />
              <button 
                type="submit" 
                className="w-full bg-gradient-to-r from-red-600 to-pink-600 text-white p-5 rounded-xl font-bold text-xl shadow-xl active:scale-95"
              >
                ✅ הוסף הוצאה
              </button>
            </form>
          </div>

          <div className="space-y-3">
            {filteredExpenses.length === 0 ? (
              <div className="bg-white rounded-xl p-8 text-center text-gray-500">
                אין הוצאות בחודש זה
              </div>
            ) : (
              filteredExpenses.map(expense => (
                <div key={expense.id} className="bg-white rounded-xl p-4 shadow-lg">
                  <div className="flex items-start justify-between mb-2">
                    <button 
                      onClick={() => handleDelete(expense.id)}
                      className="p-2 bg-red-100 rounded-lg hover:bg-red-200 active:scale-95"
                    >
                      <Trash2 className="w-5 h-5 text-red-600" />
                    </button>
                    <div className="text-right flex-1 mx-3">
                      <div className="font-bold text-lg">{expense.description}</div>
                      <div className="text-sm text-gray-600">{formatDate(expense.date)}</div>
                      {expense.category && (
                        <div className="text-xs text-gray-500 mt-1">📁 {expense.category}</div>
                      )}
                    </div>
                  </div>
                  <div className="text-left">
                    <div className="text-2xl font-bold text-red-600">₪{expense.amount.toFixed(2)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  };

  const AccountantScreen = () => {
    const analysis = getAdvancedAnalysis();
    
    // חישוב נתונים פיננסיים מתקדמים
    const getFinancialMetrics = () => {
      const thisMonthOrders = orders.filter(o => {
        const d = new Date(o.date);
        return d.getMonth() === selectedMonth.month && d.getFullYear() === selectedMonth.year;
      });
      
      const thisMonthExpenses = expenses.filter(e => {
        const d = new Date(e.date);
        return d.getMonth() === selectedMonth.month && d.getFullYear() === selectedMonth.year;
      });
      
      const revenue = thisMonthOrders.reduce((sum, o) => sum + o.total, 0);
      const totalExpenses = thisMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
      const cashCollected = thisMonthOrders.reduce((sum, o) => sum + o.paid, 0);
      const profit = revenue - totalExpenses;
      
      // יחסים פיננסיים
      const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0;
      const cashCollectionRate = revenue > 0 ? (cashCollected / revenue) * 100 : 0;
      const avgOrderValue = thisMonthOrders.length > 0 ? revenue / thisMonthOrders.length : 0;
      
      // חובות
      const totalDebt = orders.reduce((sum, o) => sum + Math.max(0, o.total - o.paid), 0);
      const overdueDebt = orders.filter(o => {
        const daysSince = Math.floor((new Date() - new Date(o.date)) / (1000 * 60 * 60 * 24));
        return daysSince > 30 && o.total > o.paid;
      }).reduce((sum, o) => sum + (o.total - o.paid), 0);
      
      return {
        revenue,
        totalExpenses,
        cashCollected,
        profit,
        profitMargin,
        cashCollectionRate,
        avgOrderValue,
        totalDebt,
        overdueDebt,
        ordersCount: thisMonthOrders.length
      };
    };
    
    const metrics = getFinancialMetrics();
    
    // ניתוח והמלצות אוטומטיות
    const getInsights = () => {
      const insights = [];
      
      // ניתוח רווחיות
      if (metrics.profitMargin < 20) {
        insights.push({
          type: 'warning',
          icon: '⚠️',
          title: 'שולי רווח נמוכים',
          message: `שולי הרווח שלך הם ${metrics.profitMargin.toFixed(1)}% בלבד. מומלץ לשאוף ל-30% לפחות.`,
          tips: [
            'בדוק אם אפשר להעלות מחירים',
            'צמצם הוצאות מיותרות',
            'התמקד במוצרים רווחיים יותר'
          ]
        });
      } else if (metrics.profitMargin >= 30) {
        insights.push({
          type: 'success',
          icon: '✅',
          title: 'שולי רווח מצוינים',
          message: `שולי הרווח שלך ${metrics.profitMargin.toFixed(1)}% - זה מצוין!`,
          tips: [
            'שמור על רמת האיכות הנוכחית',
            'שקול השקעה בצמיחה',
            'בנה מאגר חירום'
          ]
        });
      }
      
      // ניתוח גביית כספים
      if (metrics.cashCollectionRate < 70) {
        insights.push({
          type: 'danger',
          icon: '🚨',
          title: 'בעיית גביית כספים',
          message: `אתה גובה רק ${metrics.cashCollectionRate.toFixed(1)}% מהכסף שמגיע לך!`,
          tips: [
            'הקפד על תשלום במזומן או העברה מיידית',
            'הגבל אשראי ללקוחות מהימנים בלבד',
            'עקוב אחרי חובות באופן קבוע'
          ]
        });
      } else if (metrics.cashCollectionRate >= 90) {
        insights.push({
          type: 'success',
          icon: '💚',
          title: 'גבייה מצוינת',
          message: `אתה גובה ${metrics.cashCollectionRate.toFixed(1)}% מהכסף - כל הכבוד!`,
          tips: ['המשך עם המדיניות הנוכחית']
        });
      }
      
      // ניתוח חובות
      if (metrics.totalDebt > metrics.revenue * 1.5) {
        insights.push({
          type: 'danger',
          icon: '💸',
          title: 'חובות גבוהים מדי',
          message: `יש לך ₪${metrics.totalDebt.toFixed(2)} בחובות - זה יותר מדי!`,
          tips: [
            'פעל לגביית חובות באופן אגרסיבי',
            'הפסק לתת אשראי ללקוחות שחייבים',
            'שקול הנחה עבור תשלום מיידי'
          ]
        });
      }
      
      if (metrics.overdueDebt > 0) {
        insights.push({
          type: 'warning',
          icon: '⏰',
          title: 'חובות פיגורים',
          message: `יש ₪${metrics.overdueDebt.toFixed(2)} בחובות מעל 30 יום`,
          tips: [
            'צור קשר עם הלקוחות המבוגרים',
            'הצע תוכנית תשלומים',
            'שקול גביה משפטית'
          ]
        });
      }
      
      // ניתוח הוצאות
      const expenseRatio = metrics.revenue > 0 ? (metrics.totalExpenses / metrics.revenue) * 100 : 0;
      if (expenseRatio > 50) {
        insights.push({
          type: 'warning',
          icon: '📉',
          title: 'הוצאות גבוהות',
          message: `ההוצאות שלך הן ${expenseRatio.toFixed(1)}% מההכנסות`,
          tips: [
            'סקור את כל ההוצאות',
            'בטל מנויים מיותרים',
            'מצא ספקים זולים יותר'
          ]
        });
      }
      
      // ניתוח ממוצע הזמנה
      if (metrics.avgOrderValue < 50) {
        insights.push({
          type: 'info',
          icon: '💡',
          title: 'ממוצע הזמנה נמוך',
          message: `ממוצע הזמנה: ₪${metrics.avgOrderValue.toFixed(2)}`,
          tips: [
            'הצע חבילות/מארזים',
            'תן הנחה על קנייה מרובה',
            'עודד לקוחות לקנות יותר'
          ]
        });
      }
      
      return insights;
    };
    
    const insights = getInsights();
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-5 shadow-lg sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <button onClick={() => setCurrentScreen('menu')} className="p-3 hover:bg-white/20 rounded-xl min-w-[48px] min-h-[48px]">
              <X className="w-6 h-6" />
            </button>
            <h1 className="text-2xl font-bold">📊 רואה חשבון</h1>
            <div className="w-[48px]"></div>
          </div>
          
          <MonthSelector showStats={false} />
        </div>

        <div className="p-4 space-y-4">
          {/* כרטיס סיכום מהיר */}
          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl p-6 shadow-xl">
            <div className="text-center mb-4">
              <div className="text-5xl mb-2">📊</div>
              <h2 className="text-2xl font-bold">סיכום פיננסי</h2>
              <p className="text-sm opacity-90">{getMonthName(selectedMonth.month)} {selectedMonth.year}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/20 rounded-lg p-3 text-center backdrop-blur">
                <div className="text-2xl font-bold">₪{metrics.revenue.toFixed(0)}</div>
                <div className="text-xs opacity-90">הכנסות</div>
              </div>
              <div className="bg-white/20 rounded-lg p-3 text-center backdrop-blur">
                <div className="text-2xl font-bold">₪{metrics.profit.toFixed(0)}</div>
                <div className="text-xs opacity-90">רווח</div>
              </div>
              <div className="bg-white/20 rounded-lg p-3 text-center backdrop-blur">
                <div className="text-2xl font-bold">{metrics.profitMargin.toFixed(1)}%</div>
                <div className="text-xs opacity-90">שולי רווח</div>
              </div>
              <div className="bg-white/20 rounded-lg p-3 text-center backdrop-blur">
                <div className="text-2xl font-bold">{metrics.cashCollectionRate.toFixed(0)}%</div>
                <div className="text-xs opacity-90">גבייה</div>
              </div>
            </div>
          </div>

          {/* יחסים פיננסיים */}
          <div className="bg-white rounded-xl p-4 shadow-lg">
            <h3 className="font-bold text-xl mb-4 text-right flex items-center justify-end gap-2">
              <span>יחסים פיננסיים</span>
              <span className="text-2xl">📐</span>
            </h3>
            
            <div className="space-y-3">
              <div className="border-b pb-3">
                <div className="flex justify-between mb-2">
                  <span className="font-bold text-lg">{metrics.profitMargin.toFixed(1)}%</span>
                  <span className="text-gray-700">שולי רווח (Profit Margin)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full ${metrics.profitMargin >= 30 ? 'bg-green-500' : metrics.profitMargin >= 20 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{width: `${Math.min(100, metrics.profitMargin * 2)}%`}}
                  ></div>
                </div>
                <div className="text-xs text-gray-600 mt-1 text-right">
                  {metrics.profitMargin >= 30 ? '✅ מצוין' : metrics.profitMargin >= 20 ? '⚠️ סביר' : '🚨 נמוך'}
                </div>
              </div>

              <div className="border-b pb-3">
                <div className="flex justify-between mb-2">
                  <span className="font-bold text-lg">{metrics.cashCollectionRate.toFixed(1)}%</span>
                  <span className="text-gray-700">שיעור גבייה (Collection Rate)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full ${metrics.cashCollectionRate >= 90 ? 'bg-green-500' : metrics.cashCollectionRate >= 70 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{width: `${metrics.cashCollectionRate}%`}}
                  ></div>
                </div>
                <div className="text-xs text-gray-600 mt-1 text-right">
                  {metrics.cashCollectionRate >= 90 ? '✅ מצוין' : metrics.cashCollectionRate >= 70 ? '⚠️ סביר' : '🚨 דחוף לטפל'}
                </div>
              </div>

              <div className="border-b pb-3">
                <div className="flex justify-between mb-2">
                  <span className="font-bold text-lg">₪{metrics.avgOrderValue.toFixed(2)}</span>
                  <span className="text-gray-700">ממוצע הזמנה (AOV)</span>
                </div>
                <div className="text-xs text-gray-600 text-right">
                  {metrics.ordersCount > 0 ? `מבוסס על ${metrics.ordersCount} הזמנות` : 'אין הזמנות'}
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="font-bold text-lg text-red-600">₪{metrics.totalDebt.toFixed(2)}</span>
                  <span className="text-gray-700">סה"כ חובות</span>
                </div>
                {metrics.overdueDebt > 0 && (
                  <div className="text-xs text-red-600 text-right">
                    ⚠️ מתוכם ₪{metrics.overdueDebt.toFixed(2)} מעל 30 יום
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* תובנות והמלצות */}
          {insights.length > 0 && (
            <div className="bg-white rounded-xl p-4 shadow-lg">
              <h3 className="font-bold text-xl mb-4 text-right flex items-center justify-end gap-2">
                <span>תובנות והמלצות</span>
                <span className="text-2xl">💡</span>
              </h3>
              
              <div className="space-y-3">
                {insights.map((insight, idx) => (
                  <div 
                    key={idx}
                    className={`rounded-xl p-4 border-r-4 ${
                      insight.type === 'success' ? 'bg-green-50 border-green-500' :
                      insight.type === 'warning' ? 'bg-yellow-50 border-yellow-500' :
                      insight.type === 'danger' ? 'bg-red-50 border-red-500' :
                      'bg-blue-50 border-blue-500'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-3xl">{insight.icon}</span>
                      <div className="flex-1 text-right">
                        <h4 className="font-bold text-lg mb-1">{insight.title}</h4>
                        <p className="text-sm text-gray-700 mb-2">{insight.message}</p>
                        <div className="bg-white/50 rounded-lg p-3">
                          <div className="font-bold text-sm mb-2">💡 מה לעשות:</div>
                          <ul className="text-sm space-y-1">
                            {insight.tips.map((tip, tipIdx) => (
                              <li key={tipIdx} className="text-right">• {tip}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* טיפים כלליים */}
          <div className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl p-4 shadow-lg">
            <h3 className="font-bold text-lg mb-3 text-right flex items-center justify-end gap-2">
              <span>טיפים מקצועיים</span>
              <span className="text-2xl">🎯</span>
            </h3>
            
            <div className="space-y-2 text-sm">
              <div className="bg-white/20 rounded-lg p-3 backdrop-blur">
                <div className="font-bold mb-1">💰 תזרים מזומנים</div>
                <div className="text-xs opacity-90">שמור על מאגר מזומנים של לפחות 3 חודשי הוצאות</div>
              </div>
              
              <div className="bg-white/20 rounded-lg p-3 backdrop-blur">
                <div className="font-bold mb-1">📊 מעקב שבועי</div>
                <div className="text-xs opacity-90">בדוק את הנתונים הפיננסיים לפחות פעם בשבוע</div>
              </div>
              
              <div className="bg-white/20 rounded-lg p-3 backdrop-blur">
                <div className="font-bold mb-1">🎯 יעדים</div>
                <div className="text-xs opacity-90">הגדר יעדי הכנסות ורווחיות חודשיים ועקוב אחריהם</div>
              </div>
              
              <div className="bg-white/20 rounded-lg p-3 backdrop-blur">
                <div className="font-bold mb-1">💸 חובות</div>
                <div className="text-xs opacity-90">אל תתן אשראי מעל ₪200 בלי בטוחות או התחייבות</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const PrintInvoice = () => {
    if (!printOrder) return null;
    
    const customer = customers.find(c => c.id === printOrder.customerId);
    const newBalance = printOrder.previousBalance + printOrder.paid - printOrder.total;

    // פונקציה להדפסה
    const handlePrint = () => {
      // יצירת תוכן להדפסה
      const customerName = customer?.name || 'לקוח';
      const customerPhone = customer?.phone || '';
      const customerAddress = customer?.address || '';
      
      // בניית HTML של פריטים
      let itemsHTML = '';
      printOrder.items.forEach(item => {
        itemsHTML += `
          <tr>
            <td style="text-align: right; font-weight: 500; padding: 10px; border-bottom: 1px solid #ddd;">${item.productName}</td>
            <td style="text-align: center; padding: 10px; border-bottom: 1px solid #ddd;">${item.quantity}</td>
            <td style="text-align: center; padding: 10px; border-bottom: 1px solid #ddd;">₪${item.price.toFixed(2)}</td>
            <td style="text-align: left; padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold;">₪${(item.price * item.quantity).toFixed(2)}</td>
          </tr>
        `;
      });
      
      if (printOrder.hasDelivery && printOrder.deliveryPrice > 0) {
        itemsHTML += `
          <tr style="background: #e3f2fd;">
            <td style="text-align: right; font-weight: 500; padding: 10px; border-bottom: 1px solid #ddd;">🚚 משלוח</td>
            <td style="text-align: center; padding: 10px; border-bottom: 1px solid #ddd;">-</td>
            <td style="text-align: center; padding: 10px; border-bottom: 1px solid #ddd;">-</td>
            <td style="text-align: left; padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold; color: #1976d2;">₪${printOrder.deliveryPrice.toFixed(2)}</td>
          </tr>
        `;
      }
      
      const finalBalance = newBalance;
      const finalBalanceColor = finalBalance >= 0 ? '#2e7d32' : '#d32f2f';
      const finalBalanceLabel = finalBalance >= 0 ? 'זכות' : 'חוב';
      
      // יצירת HTML מלא
      const printContent = `
        <div style="max-width: 800px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif; direction: rtl;">
          <!-- כותרת -->
          <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #f57c00;">
            <div style="font-size: 60px; margin-bottom: 10px;">🌾</div>
            <h1 style="font-size: 36px; font-weight: bold; color: #e65100; margin: 10px 0;">ארבס מובחר</h1>
            <p style="color: #666; font-size: 16px;">חשבונית מס</p>
          </div>
          
          <!-- פרטים -->
          <div style="display: table; width: 100%; margin-bottom: 30px;">
            <div style="display: table-row;">
              <div style="display: table-cell; width: 50%; padding: 15px; background: #f5f5f5; border: 1px solid #ddd; border-radius: 8px; vertical-align: top;">
                <div style="color: #666; font-size: 12px; margin-bottom: 10px;">פרטי לקוח:</div>
                <div style="font-weight: bold; margin: 5px 0; font-size: 16px;">${customerName}</div>
                ${customerPhone ? `<div style="font-weight: bold; margin: 5px 0;">${customerPhone}</div>` : ''}
                ${customerAddress ? `<div style="margin: 5px 0; font-size: 13px; color: #666;">${customerAddress}</div>` : ''}
              </div>
              <div style="display: table-cell; width: 50%; padding: 15px; background: #f5f5f5; border: 1px solid #ddd; border-radius: 8px; vertical-align: top;">
                <div style="margin-bottom: 10px;">
                  <span style="color: #666; font-size: 12px;">מספר:</span>
                  <span style="font-weight: bold; float: left;">${printOrder.id}</span>
                </div>
                <div>
                  <span style="color: #666; font-size: 12px;">תאריך:</span>
                  <span style="float: left;">${formatDate(printOrder.date)}</span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- טבלת פריטים -->
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; border: 1px solid #ddd;">
            <thead>
              <tr style="background: #f57c00; color: white;">
                <th style="padding: 12px; text-align: right;">פריט</th>
                <th style="padding: 12px; text-align: center; width: 80px;">כמות</th>
                <th style="padding: 12px; text-align: center; width: 100px;">מחיר</th>
                <th style="padding: 12px; text-align: left; width: 120px;">סה"כ</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHTML}
            </tbody>
          </table>
          
          ${printOrder.notes ? `
            <div style="background: #fff3e0; border-right: 3px solid #f57c00; padding: 15px; margin-bottom: 20px; border-radius: 4px;">
              <div style="font-weight: bold; margin-bottom: 5px; font-size: 13px;">הערות:</div>
              <div style="font-size: 13px;">${printOrder.notes}</div>
            </div>
          ` : ''}
          
          <!-- סיכום -->
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; border: 2px solid #ddd;">
            ${printOrder.previousBalance !== 0 ? `
              <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #ddd; margin-bottom: 10px;">
                <span style="font-weight: bold; color: ${printOrder.previousBalance >= 0 ? '#2e7d32' : '#d32f2f'};">₪${Math.abs(printOrder.previousBalance).toFixed(2)}</span>
                <span>יתרה קודמת:</span>
              </div>
            ` : ''}
            <div style="display: flex; justify-content: space-between; padding: 10px 0;">
              <span style="font-weight: bold; font-size: 16px;">₪${printOrder.total.toFixed(2)}</span>
              <span style="font-weight: 600;">סה"כ הזמנה:</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 10px 0; color: #2e7d32;">
              <span style="font-weight: bold; font-size: 16px;">₪${printOrder.paid.toFixed(2)}</span>
              <span style="font-weight: 600;">שולם:</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 15px 0 0 0; margin-top: 10px; border-top: 2px solid #666; font-size: 20px; font-weight: bold; color: ${finalBalanceColor};">
              <span>₪${Math.abs(finalBalance).toFixed(2)}</span>
              <span>${finalBalanceLabel}:</span>
            </div>
          </div>
          
          <!-- כותרת תחתונה -->
          <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; color: #666;">
            <div style="font-weight: bold; margin-bottom: 5px; font-size: 15px;">תודה על העסקה! 🙏</div>
            <div style="font-size: 12px;">🌾 ארבס מובחר - איכות ושירות מעולים</div>
          </div>
        </div>
      `;
      
      // יצירת חלון הדפסה
      const printWindow = window.open('', '', 'width=800,height=600');
      if (!printWindow) {
        alert('לא ניתן לפתוח חלון הדפסה. אנא בדוק שהדפדפן לא חוסם חלונות קופצים.');
        return;
      }
      
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>חשבונית - ${customerName}</title>
          <style>
            @media print {
              body { margin: 0; padding: 10px; }
              @page { margin: 1cm; }
            }
            body { margin: 0; padding: 0; }
          </style>
        </head>
        <body>
          ${printContent}
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 250);
            };
          </script>
        </body>
        </html>
      `);
      
      printWindow.document.close();
    };

    // פונקציה להורדת החשבונית כ-PDF
    const downloadPDF = () => {
      const customerName = customer?.name || 'לקוח';
      const customerPhone = customer?.phone || '';
      const customerAddress = customer?.address || '';
      
      // בניית HTML של פריטים
      let itemsHTML = '';
      printOrder.items.forEach((item, idx) => {
        itemsHTML += `
          <tr style="border-bottom: 1px solid #e0e0e0;">
            <td style="padding: 12px; text-align: right; font-weight: 500;">${item.productName}</td>
            <td style="padding: 12px; text-align: center;">${item.quantity}</td>
            <td style="padding: 12px; text-align: center;">₪${item.price.toFixed(2)}</td>
            <td style="padding: 12px; text-align: left; font-weight: bold; color: #2e7d32;">₪${(item.price * item.quantity).toFixed(2)}</td>
          </tr>
        `;
      });
      
      if (printOrder.hasDelivery && printOrder.deliveryPrice > 0) {
        itemsHTML += `
          <tr style="background: #e3f2fd; border-bottom: 1px solid #e0e0e0;">
            <td style="padding: 12px; text-align: right; font-weight: 500;">🚚 משלוח</td>
            <td style="padding: 12px; text-align: center;">-</td>
            <td style="padding: 12px; text-align: center;">-</td>
            <td style="padding: 12px; text-align: left; font-weight: bold; color: #1976d2;">₪${printOrder.deliveryPrice.toFixed(2)}</td>
          </tr>
        `;
      }
      
      const finalBalance = newBalance;
      const finalBalanceColor = finalBalance >= 0 ? '#2e7d32' : '#d32f2f';
      const finalBalanceLabel = finalBalance >= 0 ? 'זכות' : 'חוב';
      
      // יצירת HTML מלא
      const htmlContent = `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>חשבונית - ${customerName}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: Arial, sans-serif;
      direction: rtl;
      padding: 20px;
      max-width: 800px;
      margin: 0 auto;
      background: white;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 3px solid #f57c00;
    }
    .icon { font-size: 60px; margin-bottom: 10px; }
    .company {
      font-size: 36px;
      font-weight: bold;
      color: #e65100;
      margin: 10px 0;
    }
    .subtitle { color: #666; font-size: 16px; }
    .details {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 30px;
    }
    .box {
      background: #f5f5f5;
      padding: 15px;
      border: 1px solid #ddd;
      border-radius: 8px;
    }
    .label {
      color: #666;
      font-size: 12px;
      margin-bottom: 10px;
      font-weight: bold;
    }
    .value {
      font-weight: bold;
      margin: 5px 0;
      font-size: 15px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
      border: 1px solid #ddd;
    }
    th {
      background: #f57c00;
      color: white;
      padding: 12px;
      text-align: center;
      font-weight: bold;
    }
    td {
      padding: 12px;
      text-align: center;
    }
    .notes {
      background: #fff3e0;
      border-right: 3px solid #f57c00;
      padding: 15px;
      margin-bottom: 20px;
      border-radius: 4px;
    }
    .summary {
      background: #f5f5f5;
      padding: 20px;
      border-radius: 8px;
      border: 2px solid #ddd;
    }
    .row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      font-size: 16px;
    }
    .row.total {
      border-top: 2px solid #666;
      margin-top: 10px;
      padding-top: 15px;
      font-size: 20px;
      font-weight: bold;
    }
    .footer {
      text-align: center;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      color: #666;
    }
    .share-buttons {
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: white;
      padding: 15px;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      display: flex;
      gap: 10px;
      z-index: 1000;
    }
    .share-btn {
      padding: 12px 24px;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: bold;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .whatsapp-btn {
      background: #25D366;
      color: white;
    }
    .print-btn {
      background: #2196F3;
      color: white;
    }
    @media print {
      .share-buttons { display: none; }
      body { padding: 10px; }
      @page { margin: 1cm; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="icon">🌾</div>
    <div class="company">ארבס מובחר</div>
    <div class="subtitle">חשבונית מס</div>
  </div>

  <div class="details">
    <div class="box">
      <div class="label">פרטי לקוח:</div>
      <div class="value">${customerName}</div>
      ${customerPhone ? `<div class="value">${customerPhone}</div>` : ''}
      ${customerAddress ? `<div class="value" style="font-size: 13px; color: #666;">${customerAddress}</div>` : ''}
    </div>
    <div class="box">
      <div class="row" style="margin-bottom: 10px;">
        <span style="font-weight: bold;">${printOrder.id}</span>
        <span class="label">מספר:</span>
      </div>
      <div class="row">
        <span>${formatDate(printOrder.date)}</span>
        <span class="label">תאריך:</span>
      </div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="text-align: right;">פריט</th>
        <th style="width: 80px;">כמות</th>
        <th style="width: 100px;">מחיר</th>
        <th style="width: 120px; text-align: left;">סה"כ</th>
      </tr>
    </thead>
    <tbody>
      ${itemsHTML}
    </tbody>
  </table>

  ${printOrder.notes ? `
    <div class="notes">
      <div style="font-weight: bold; margin-bottom: 5px; font-size: 13px;">הערות:</div>
      <div style="font-size: 13px;">${printOrder.notes}</div>
    </div>
  ` : ''}

  <div class="summary">
    ${printOrder.previousBalance !== 0 ? `
      <div class="row" style="border-bottom: 1px solid #ddd; margin-bottom: 10px; padding-bottom: 10px;">
        <span style="font-weight: bold; color: ${printOrder.previousBalance >= 0 ? '#2e7d32' : '#d32f2f'};">
          ₪${Math.abs(printOrder.previousBalance).toFixed(2)}
        </span>
        <span style="font-weight: 600;">יתרה קודמת:</span>
      </div>
    ` : ''}
    <div class="row">
      <span style="font-weight: bold;">₪${printOrder.total.toFixed(2)}</span>
      <span style="font-weight: 600;">סה"כ הזמנה:</span>
    </div>
    <div class="row" style="color: #2e7d32;">
      <span style="font-weight: bold;">₪${printOrder.paid.toFixed(2)}</span>
      <span style="font-weight: 600;">שולם:</span>
    </div>
    <div class="row total" style="color: ${finalBalanceColor};">
      <span>₪${Math.abs(finalBalance).toFixed(2)}</span>
      <span>${finalBalanceLabel}:</span>
    </div>
  </div>

  <div class="footer">
    <div style="font-weight: bold; margin-bottom: 5px; font-size: 15px;">תודה על העסקה! 🙏</div>
    <div style="font-size: 12px;">🌾 ארבס מובחר - איכות ושירות מעולים</div>
  </div>

  <div class="share-buttons">
    <button class="share-btn print-btn" onclick="window.print()">
      🖨️ הדפס כ-PDF
    </button>
    <button class="share-btn whatsapp-btn" onclick="if(navigator.share) { navigator.share({title: 'חשבונית - ${customerName}', text: 'חשבונית מס מארבס מובחר'}); } else { alert('שתף את הדף הזה דרך הדפדפן'); }">
      💬 שתף בוואטסאפ
    </button>
  </div>

  <script>
    // אם נתמך שיתוף קבצים
    if (navigator.share) {
      console.log('Share API supported');
    }
  </script>
</body>
</html>
      `;
      
      // פתיחת החלון החדש
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert('לא ניתן לפתוח חלון. אנא אפשר חלונות קופצים בדפדפן.');
        return;
      }
      
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      // הודעה למשתמש
      setTimeout(() => {
        alert('📄 החשבונית נפתחה בחלון חדש!\n\n📱 מהנייד:\n1. לחץ על "שתף בוואטסאפ"\n2. או לחץ "הדפס כ-PDF" ושמור\n3. שלח את הקובץ בוואטסאפ\n\n💻 מהמחשב:\nלחץ "הדפס כ-PDF" ובחר "שמור כ-PDF"');
      }, 500);
    };

    // פונקציה לשליחת החשבונית בוואטסאפ
    const sendToWhatsApp = () => {
      // בדיקה אם יש טלפון ללקוח
      const phoneNumber = customer?.phone?.replace(/[^0-9]/g, '') || '';
      
      let message = `🌾 *ארבס מובחר*\n`;
      message += `📄 *חשבונית מס*\n`;
      message += `━━━━━━━━━━━━━━━━\n\n`;
      
      // פרטי לקוח
      message += `👤 *לקוח:* ${customer?.name || ''}\n`;
      if (customer?.phone) message += `📞 ${customer.phone}\n`;
      if (customer?.address) message += `📍 ${customer.address}\n`;
      message += `\n`;
      
      // פרטי חשבונית
      message += `🔢 *מספר חשבונית:* ${printOrder.id}\n`;
      message += `📅 *תאריך:* ${formatDate(printOrder.date)}\n`;
      message += `\n━━━━━━━━━━━━━━━━\n\n`;
      
      // פריטים
      message += `📦 *פריטים שנרכשו:*\n\n`;
      printOrder.items.forEach((item, idx) => {
        message += `${idx + 1}. *${item.productName}*\n`;
        message += `   כמות: ${item.quantity} | מחיר: ₪${item.price.toFixed(2)}\n`;
        message += `   סה"כ: *₪${(item.price * item.quantity).toFixed(2)}*\n\n`;
      });
      
      // משלוח
      if (printOrder.hasDelivery && printOrder.deliveryPrice > 0) {
        message += `🚚 *דמי משלוח:* ₪${printOrder.deliveryPrice.toFixed(2)}\n\n`;
      }
      
      message += `━━━━━━━━━━━━━━━━\n\n`;
      
      // סיכום כספי
      message += `💰 *סיכום כספי:*\n\n`;
      
      if (printOrder.previousBalance !== 0) {
        const balanceType = printOrder.previousBalance >= 0 ? 'זכות קודמת' : 'חוב קודם';
        message += `${printOrder.previousBalance >= 0 ? '💚' : '❤️'} ${balanceType}: ₪${Math.abs(printOrder.previousBalance).toFixed(2)}\n`;
      }
      
      message += `💵 סה"כ הזמנה: ₪${printOrder.total.toFixed(2)}\n`;
      message += `✅ שולם כעת: ₪${printOrder.paid.toFixed(2)}\n`;
      message += `\n`;
      
      const finalBalance = newBalance;
      const balanceEmoji = finalBalance >= 0 ? '💚' : '❤️';
      const balanceLabel = finalBalance >= 0 ? 'זכות יתרה' : 'חוב יתרה';
      message += `${balanceEmoji} *${balanceLabel}: ₪${Math.abs(finalBalance).toFixed(2)}*\n`;
      
      // הערות
      if (printOrder.notes) {
        message += `\n━━━━━━━━━━━━━━━━\n`;
        message += `💬 *הערות:*\n${printOrder.notes}\n`;
      }
      
      message += `\n━━━━━━━━━━━━━━━━\n`;
      message += `\n✨ תודה רבה על העסקה!\n`;
      message += `🌾 *ארבס מובחר* - איכות ושירות מעולים\n\n`;
      message += `לשאלות ופניות: ${customer?.phone || 'צור קשר'}`;

      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = phoneNumber 
        ? `https://wa.me/${phoneNumber}?text=${encodedMessage}`
        : `https://wa.me/?text=${encodedMessage}`;
      
      window.open(whatsappUrl, '_blank');
      
      // הודעת הצלחה
      setTimeout(() => {
        alert(`✅ חשבונית נשלחה בוואטסאפ!\n\n${phoneNumber ? `נשלח ל: ${customer?.phone}` : 'בחר איש קשר בוואטסאפ'}`);
      }, 500);
    };

    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 no-print" onClick={() => setPrintOrder(null)}>
        <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl print-invoice" onClick={(e) => e.stopPropagation()}>
          <div className="sticky top-0 bg-gradient-to-r from-amber-600 to-orange-600 text-white p-4 rounded-t-2xl z-10 no-print">
            <div className="flex items-center justify-between mb-3">
              <button onClick={() => setPrintOrder(null)} className="p-2 hover:bg-white/20 rounded-xl min-w-[48px] min-h-[48px]">
                <X className="w-6 h-6" />
              </button>
              <h2 className="text-xl font-bold">חשבונית</h2>
              <div className="w-[48px]"></div>
            </div>
            
            {/* כפתור שליחה לוואטסאפ */}
            <button 
              onClick={downloadPDF}
              className="w-full bg-green-500 hover:bg-green-600 p-4 rounded-xl flex items-center justify-center gap-3 active:scale-95 font-bold text-lg shadow-lg"
            >
              <span className="text-2xl">💬</span>
              <span>שתף חשבונית בוואטסאפ</span>
              <span className="text-2xl">📄</span>
            </button>
          </div>
          
          <div className="p-4 md:p-8">
            <div className="text-center mb-6 md:mb-8">
              <div className="text-4xl md:text-5xl mb-3">🌾</div>
              <h1 className="text-3xl md:text-4xl font-bold text-amber-800 mb-2">ארבס מובחר</h1>
              <p className="text-gray-600 text-sm md:text-base">חשבונית מס</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-4 md:mb-6">
              <div className="bg-gray-50 rounded-xl p-3 md:p-4">
                <div className="text-sm md:text-base text-gray-600 mb-2">פרטי לקוח:</div>
                <div className="space-y-1">
                  <div className="font-bold text-base md:text-lg">{customer?.name}</div>
                  <div className="text-sm md:text-base">{customer?.phone}</div>
                  {customer?.address && <div className="text-xs md:text-sm text-gray-600">{customer?.address}</div>}
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-xl p-3 md:p-4">
                <div className="flex flex-col gap-2 text-sm md:text-base">
                  <div className="flex justify-between">
                    <span className="font-bold">{printOrder.id}</span>
                    <span className="text-gray-600">מספר:</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{formatDate(printOrder.date)}</span>
                    <span className="text-gray-600">תאריך:</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <div className="md:hidden space-y-2">
                {printOrder.items.map((item, idx) => (
                  <div key={idx} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <div className="font-bold text-sm text-right mb-2">{item.productName}</div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="text-center">
                        <div className="text-gray-600 mb-1">כמות</div>
                        <div className="font-bold">{item.quantity}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-gray-600 mb-1">מחיר</div>
                        <div className="font-bold">₪{item.price.toFixed(2)}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-gray-600 mb-1">סה"כ</div>
                        <div className="font-bold text-green-600">₪{(item.price * item.quantity).toFixed(2)}</div>
                      </div>
                    </div>
                  </div>
                ))}
                {printOrder.hasDelivery && printOrder.deliveryPrice > 0 && (
                  <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                    <div className="font-bold text-sm text-right mb-2">🚚 משלוח</div>
                    <div className="text-center">
                      <div className="font-bold text-blue-600 text-lg">₪{printOrder.deliveryPrice.toFixed(2)}</div>
                    </div>
                  </div>
                )}
              </div>

              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-amber-600 text-white">
                      <th className="p-3 text-right rounded-tr-xl">פריט</th>
                      <th className="p-3 text-center" style={{width: '80px'}}>כמות</th>
                      <th className="p-3 text-center" style={{width: '80px'}}>מחיר</th>
                      <th className="p-3 text-left rounded-tl-xl" style={{width: '100px'}}>סה"כ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {printOrder.items.map((item, idx) => (
                      <tr key={idx} className="border-b hover:bg-gray-50">
                        <td className="p-3 text-right font-medium">{item.productName}</td>
                        <td className="p-3 text-center">{item.quantity}</td>
                        <td className="p-3 text-center">₪{item.price.toFixed(2)}</td>
                        <td className="p-3 text-left font-bold text-green-600">₪{(item.price * item.quantity).toFixed(2)}</td>
                      </tr>
                    ))}
                    {printOrder.hasDelivery && printOrder.deliveryPrice > 0 && (
                      <tr className="border-b bg-blue-50 hover:bg-blue-100">
                        <td className="p-3 text-right font-medium">🚚 משלוח</td>
                        <td className="p-3 text-center">-</td>
                        <td className="p-3 text-center">-</td>
                        <td className="p-3 text-left font-bold text-blue-600">₪{printOrder.deliveryPrice.toFixed(2)}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {printOrder.notes && (
              <div className="bg-yellow-50 border-r-2 border-yellow-400 p-2.5 md:p-3 rounded-lg mb-3 md:mb-4">
                <div className="font-bold mb-1 text-xs md:text-sm">הערות:</div>
                <div className="text-gray-700 text-xs md:text-sm">{printOrder.notes}</div>
              </div>
            )}

            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-3 md:p-5 shadow-inner">
              <div className="space-y-1.5 md:space-y-2 text-sm md:text-base">
                {printOrder.previousBalance !== 0 && (
                  <div className="flex justify-between pb-1.5 md:pb-2 border-b">
                    <span className={`font-bold ${printOrder.previousBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ₪{Math.abs(printOrder.previousBalance).toFixed(2)}
                    </span>
                    <span className="text-gray-700">יתרה קודמת:</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="font-bold">₪{printOrder.total.toFixed(2)}</span>
                  <span className="font-semibold">סה"כ הזמנה:</span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span className="font-bold">₪{printOrder.paid.toFixed(2)}</span>
                  <span className="font-semibold">שולם:</span>
                </div>
                <div className={`flex justify-between text-lg md:text-xl font-bold pt-2 md:pt-3 border-t-2 ${newBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  <span>₪{Math.abs(newBalance).toFixed(2)}</span>
                  <span>{newBalance >= 0 ? 'זכות' : 'חוב'}:</span>
                </div>
              </div>
            </div>

            <div className="text-center mt-4 md:mt-6 pt-4 md:pt-6 border-t text-gray-600 mb-4">
              <p className="text-sm md:text-base font-semibold mb-1">תודה על העסקה! 🙏</p>
              <p className="text-xs">🌾 ארבס מובחר - איכות ושירות מעולים</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="font-sans">
      <style>{`
        * { -webkit-tap-highlight-color: transparent; }
        body { overflow-x: hidden; }
        input, textarea, select, button { font-size: 16px !important; }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce { animation: bounce 1s infinite; }
        
        /* סגנונות להדפסה */
        @media print {
          /* הסתרת כל דבר מלבד החשבונית */
          body > * {
            display: none !important;
          }
          
          /* הצגת רק החשבונית */
          .print-invoice {
            display: block !important;
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: auto !important;
            background: white !important;
            overflow: visible !important;
          }
          
          /* הסתרת כפתורים ורקע */
          .no-print {
            display: none !important;
          }
          
          /* התאמת עמוד */
          @page {
            margin: 1.5cm;
            size: A4;
          }
        }
      `}</style>
      
      {currentScreen === 'home' && <HomePage />}
      {currentScreen === 'menu' && <MenuScreen />}
      {currentScreen === 'newOrder' && <NewOrderForm />}
      {currentScreen === 'orders' && <OrdersScreen />}
      {currentScreen === 'dailySummary' && <DailySummaryScreen />}
      {currentScreen === 'returns' && <ReturnsScreen />}
      {currentScreen === 'customers' && <CustomersScreen />}
      {currentScreen === 'customerFolder' && <CustomerFolderScreen />}
      {currentScreen === 'accountant' && <AccountantScreen />}
      {currentScreen === 'reports' && <ReportsScreen />}
      {currentScreen === 'expenses' && <ExpensesScreen />}
      {printOrder && <PrintInvoice />}
    </div>
  );
};

export default ArbessOrderManager;
