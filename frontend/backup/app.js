const { useState, useEffect, useRef } = React;
const { createRoot } = ReactDOM;

// --- API Mocking Setup (Fallback if no backend) ---
const api = {
  post: async (url, data) => {
    try {
      // Attempt real call to localhost:1337
      const response = await axios.post(`http://localhost:1337${url}`, data);
      return response;
    } catch (err) {
      console.warn(`Real API failed for ${url}, using mock data.`, err.message);
      // Mock data responses
      return new Promise((resolve) => {
        setTimeout(() => {
          if (url === '/api/v1/customer/auth/login') {
            if (data.phone === '0900000001' && data.password === 'Password123') {
              resolve({ data: { err: 200, data: { customer: { id: 'u1', phone: data.phone, displayName: 'Nguyen Van A' }, auth: { tokenType: 'Bearer' } } } });
            } else {
              resolve({ data: { err: 400, message: 'Sai số điện thoại hoặc mật khẩu' } });
            }
          }
          if (url === '/api/v1/customer/auth/register') {
            resolve({ data: { err: 200, data: { customer: { id: 'u2', phone: data.phone, displayName: data.displayName || 'Người dùng mới' }, pocket: { balance: 0 }, auth: { tokenType: 'Bearer' } } } });
          }
          if (url === '/api/v1/customer/services/list') {
            resolve({ data: { err: 200, data: { items: [
              { code: 'P2P_TRANSFER', name: 'Chuyển tiền P2P', description: 'Chuyển tiền nội bộ' },
              { code: 'BILL_PAYMENT', name: 'Thanh toán hóa đơn', description: 'Điện, nước, internet' },
              { code: 'TOPUP', name: 'Nạp tiền điện thoại', description: 'Nạp thẻ cào' }
            ]}}});
          }
          if (url === '/api/v1/customer/services/input-fields') {
            const isBill = data.serviceCode === 'BILL_PAYMENT';
            resolve({ data: { err: 200, data: { bodyFields: isBill ? [
              { name: 'providerCode', transField: 'provider', role: 'Nhà cung cấp', dataType: 'string', required: true },
              { name: 'customerCode', transField: 'customer', role: 'Mã khách hàng (VD: PE123)', dataType: 'string', required: true },
              { name: 'amount', transField: 'amount', role: 'Số tiền thanh toán', dataType: 'number', required: true }
            ] : [
              { name: 'receiverPhone', transField: 'receiver', role: 'Số điện thoại người nhận', dataType: 'string', required: true },
              { name: 'amount', transField: 'amount', role: 'Số tiền (VNĐ)', dataType: 'number', required: true },
              { name: 'message', transField: 'message', role: 'Lời nhắn', dataType: 'string', required: false }
            ]}}});
          }
          if (url === '/api/v1/customer/providers/list') {
            resolve({ data: { err: 200, data: { items: [
              { code: 'EVN_HN', name: 'Điện lực Hà Nội' },
              { code: 'EVN_HCM', name: 'Điện lực TP.HCM' },
              { code: 'VIWACO', name: 'Nước sạch Viwaco' }
            ]}}});
          }
          if (url === '/api/v1/transactions/request') {
            resolve({ data: { err: 200, data: { transRefId: 'txn_' + Date.now(), totalAmount: Number(data.amount) || 50000, fee: 0 }}});
          }
          if (url === '/api/v1/transactions/confirm') {
            resolve({ data: { err: 200, data: { transRefId: data.transRefId, authMethod: 'PIN' }}});
          }
          if (url === '/api/v1/transactions/verify') {
            if (data.pin === '123456') {
              resolve({ data: { err: 200, data: { transRefId: data.transRefId, transaction: { id: 't1', code: 'TXN' + Date.now() }, service: { name: 'Giao dịch' }, status: 'SUCCESS', totalAmount: 50000, fee: 0, currency: 'VND' }}});
            } else {
              resolve({ data: { err: 400, message: 'Mã PIN không đúng' } });
            }
          }
          if (url === '/api/v1/customer/transactions/list') {
            resolve({ data: { err: 200, data: { items: [
              { id: '1', code: 'TXN1001', transRefId: 'txn_1', direction: 'sent', amount: 50000, message: 'Chuyển tiền ăn trưa', createdAt: new Date().toISOString() },
              { id: '2', code: 'TXN1002', transRefId: 'txn_2', direction: 'received', amount: 200000, message: 'Trả tiền xe', createdAt: new Date(Date.now() - 86400000).toISOString() }
            ]}}});
          }
        }, 500);
      });
    }
  }
};

// --- Components ---

const AuthScreen = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [phone, setPhone] = useState('0900000001');
  const [password, setPassword] = useState('Password123');
  const [displayName, setDisplayName] = useState('');
  const [pin, setPin] = useState('123456');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const url = isLogin ? '/api/v1/customer/auth/login' : '/api/v1/customer/auth/register';
    const payload = isLogin ? { phone, password } : { phone, password, displayName, pin };

    api.post(url, payload).then(res => {
      setLoading(false);
      if (res.data.err === 200) {
        onLogin(res.data.data.customer);
      } else {
        setError(res.data.message || 'Có lỗi xảy ra');
      }
    });
  };

  return (
    <div className="auth-container">
      <div className="auth-header">
        <h1>Mini Wallet</h1>
        <p>Ví điện tử siêu tốc của bạn</p>
      </div>
      
      <form onSubmit={handleSubmit}>
        {!isLogin && (
          <div className="form-group">
            <label>Họ và tên</label>
            <input type="text" className="input-field" value={displayName} onChange={e => setDisplayName(e.target.value)} required />
          </div>
        )}
        <div className="form-group">
          <label>Số điện thoại</label>
          <input type="text" className="input-field" value={phone} onChange={e => setPhone(e.target.value)} required />
        </div>
        <div className="form-group">
          <label>Mật khẩu</label>
          <input type="password" className="input-field" value={password} onChange={e => setPassword(e.target.value)} required />
        </div>
        {!isLogin && (
          <div className="form-group">
            <label>Mã PIN (6 số)</label>
            <input type="password" maxLength={6} className="input-field" value={pin} onChange={e => setPin(e.target.value)} required />
          </div>
        )}
        
        {error && <div className="error-text mb-6 text-center">{error}</div>}
        
        <button type="submit" className="btn mt-4" disabled={loading}>
          {loading ? 'Đang xử lý...' : (isLogin ? 'Đăng nhập' : 'Đăng ký')}
        </button>
      </form>
      
      <div className="auth-switch">
        {isLogin ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}
        <span onClick={() => { setIsLogin(!isLogin); setError(''); }}>
          {isLogin ? 'Đăng ký ngay' : 'Đăng nhập'}
        </span>
      </div>
    </div>
  );
};

const PinPad = ({ onComplete, onCancel }) => {
  const [pin, setPin] = useState('');
  
  const handlePress = (num) => {
    if (pin.length < 6) {
      const newPin = pin + num;
      setPin(newPin);
      if (newPin.length === 6) {
        onComplete(newPin);
      }
    }
  };
  
  const handleDel = () => {
    setPin(pin.slice(0, -1));
  };

  return (
    <div className="content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ alignSelf: 'flex-start', cursor: 'pointer', marginBottom: '1rem' }} onClick={onCancel}>
        <lucide.ArrowLeft size={24} />
      </div>
      <h2>Nhập mã PIN</h2>
      <p>Vui lòng nhập 6 số mã PIN để xác nhận</p>
      
      <div className="pin-display">
        {[...Array(6)].map((_, i) => (
          <div key={i} className={`pin-dot ${i < pin.length ? 'filled' : ''}`}></div>
        ))}
      </div>
      
      <div className="pin-pad">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
          <div key={num} className="pin-btn" onClick={() => handlePress(num.toString())}>{num}</div>
        ))}
        <div></div>
        <div className="pin-btn" onClick={() => handlePress('0')}>0</div>
        <div className="pin-btn" onClick={handleDel}><lucide.Delete size={24} /></div>
      </div>
    </div>
  );
};

const ReceiptScreen = ({ receipt, onDone }) => {
  return (
    <div className="content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '2rem' }}>
      <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(34, 197, 94, 0.2)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
        <lucide.Check size={32} />
      </div>
      <h2 style={{ marginBottom: '0.25rem' }}>Giao dịch thành công</h2>
      <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '2rem' }}>
        {receipt.totalAmount?.toLocaleString()} VND
      </p>
      
      <div className="receipt-card" style={{ width: '100%' }}>
        <div className="receipt-row">
          <span className="receipt-label">Mã giao dịch</span>
          <span className="receipt-value">{receipt.transaction?.code || receipt.transRefId}</span>
        </div>
        <div className="receipt-row">
          <span className="receipt-label">Dịch vụ</span>
          <span className="receipt-value">{receipt.service?.name}</span>
        </div>
        <div className="receipt-row">
          <span className="receipt-label">Phí giao dịch</span>
          <span className="receipt-value">{receipt.fee === 0 ? 'Miễn phí' : `${receipt.fee} VND`}</span>
        </div>
        <div className="receipt-row">
          <span className="receipt-label">Thời gian</span>
          <span className="receipt-value">{new Date().toLocaleString()}</span>
        </div>
      </div>
      
      <button className="btn mt-8" onClick={onDone}>Về trang chủ</button>
    </div>
  );
};

const ProviderModal = ({ serviceCode, onSelect, onClose }) => {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.post('/api/v1/customer/providers/list', { serviceCode, page: 1, pageSize: 20 })
      .then(res => {
        setProviders(res.data.data.items);
        setLoading(false);
      });
  }, [serviceCode]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h2>Chọn Nhà cung cấp</h2>
        <p>Vui lòng chọn nhà cung cấp dịch vụ</p>
        {loading ? <p>Đang tải...</p> : (
          <div>
            {providers.map(p => (
              <div key={p.code} className="provider-item" onClick={() => onSelect(p)}>
                <div>
                  <div style={{ fontWeight: 600 }}>{p.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Mã: {p.code}</div>
                </div>
                <lucide.ChevronRight size={20} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const ServiceFlow = ({ service, onBack }) => {
  const [step, setStep] = useState(1); // 1: Form, 2: Confirm, 3: PIN, 4: Receipt
  const [fields, setFields] = useState([]);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [previewData, setPreviewData] = useState(null);
  const [receiptData, setReceiptData] = useState(null);
  
  const [showProviderModal, setShowProviderModal] = useState(false);
  const [activeProviderField, setActiveProviderField] = useState(null);

  useEffect(() => {
    api.post('/api/v1/customer/services/input-fields', { serviceCode: service.code })
      .then(res => {
        setFields(res.data.data.bodyFields || []);
        setLoading(false);
      });
  }, [service]);

  const handleChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleProviderClick = (fieldName) => {
    setActiveProviderField(fieldName);
    setShowProviderModal(true);
  };

  const handleProviderSelect = (provider) => {
    handleChange(activeProviderField, provider.code);
    setShowProviderModal(false);
  };

  // Step 1 -> 2
  const onRequestSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    const payload = { serviceCode: service.code, ...formData };
    api.post('/api/v1/transactions/request', payload).then(res => {
      setPreviewData(res.data.data);
      setStep(2);
      setLoading(false);
    });
  };

  // Step 2 -> 3
  const onConfirm = () => {
    setLoading(true);
    api.post('/api/v1/transactions/confirm', { transRefId: previewData.transRefId }).then(res => {
      setStep(3);
      setLoading(false);
    });
  };

  // Step 3 -> 4
  const onVerifyPin = (pin) => {
    setLoading(true);
    api.post('/api/v1/transactions/verify', { transRefId: previewData.transRefId, pin }).then(res => {
      setLoading(false);
      if (res.data.err === 200) {
        setReceiptData(res.data.data);
        setStep(4);
      } else {
        setError(res.data.message || 'Xác thực thất bại');
        setStep(3); // Reset PIN
      }
    });
  };

  if (loading && step === 1) return <div className="content">Đang tải cấu hình dịch vụ...</div>;

  if (step === 3) {
    return (
      <div className="app-container">
         <PinPad onComplete={onVerifyPin} onCancel={() => setStep(2)} />
         {error && <div className="error-text text-center">{error}</div>}
      </div>
    );
  }

  if (step === 4) {
    return <ReceiptScreen receipt={receiptData} onDone={onBack} />;
  }

  return (
    <div className="content">
      <div className="flex items-center mb-6" style={{ gap: '1rem', cursor: 'pointer' }} onClick={step === 2 ? () => setStep(1) : onBack}>
        <lucide.ArrowLeft size={24} />
        <h2>{step === 1 ? service.name : 'Xác nhận giao dịch'}</h2>
      </div>

      {step === 1 && (
        <form onSubmit={onRequestSubmit}>
          {fields.map(f => (
            <div key={f.name} className="form-group">
              <label>{f.name} {f.required && '*'}</label>
              
              {f.name === 'providerCode' ? (
                <div 
                  className="input-field" 
                  style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}
                  onClick={() => handleProviderClick(f.name)}
                >
                  <span>{formData[f.name] || f.role || 'Chọn nhà cung cấp'}</span>
                  <lucide.Search size={20} />
                </div>
              ) : (
                <input
                  type={f.dataType === 'number' ? 'number' : 'text'}
                  className="input-field"
                  placeholder={f.role || `Nhập ${f.name}`}
                  required={f.required}
                  value={formData[f.name] || ''}
                  onChange={e => handleChange(f.name, e.target.value)}
                />
              )}
            </div>
          ))}

          <button type="submit" className="btn mt-8" disabled={loading}>
            Tiếp tục <lucide.ArrowRight size={20} />
          </button>
        </form>
      )}

      {step === 2 && previewData && (
        <div>
          <div className="receipt-card">
             <div className="receipt-row">
               <span className="receipt-label">Dịch vụ</span>
               <span className="receipt-value">{service.name}</span>
             </div>
             {Object.keys(formData).map(k => (
                <div className="receipt-row" key={k}>
                  <span className="receipt-label">{k}</span>
                  <span className="receipt-value">{formData[k]}</span>
                </div>
             ))}
             <div className="receipt-row" style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
               <span className="receipt-label">Tổng tiền</span>
               <span className="receipt-value" style={{ fontSize: '1.25rem', color: 'var(--primary)' }}>
                 {previewData.totalAmount?.toLocaleString()} VND
               </span>
             </div>
          </div>
          <button className="btn mt-8" onClick={onConfirm} disabled={loading}>
            Xác nhận
          </button>
        </div>
      )}

      {showProviderModal && (
        <ProviderModal 
          serviceCode={service.code} 
          onClose={() => setShowProviderModal(false)}
          onSelect={handleProviderSelect}
        />
      )}
    </div>
  );
};

const ServiceList = ({ onSelect }) => {
  const [services, setServices] = useState([]);

  useEffect(() => {
    api.post('/api/v1/customer/services/list', { page: 1, pageSize: 20 })
      .then(res => {
        setServices(res.data.data.items || []);
      });
  }, []);

  return (
    <div className="content">
      <h2 className="mb-6">Dịch vụ nổi bật</h2>
      <div className="service-list">
        {services.map(s => (
          <div key={s.code} className="service-card" onClick={() => onSelect(s)}>
            <div className="service-icon">
              {s.code === 'P2P_TRANSFER' ? <lucide.Send size={24} /> : 
               s.code === 'BILL_PAYMENT' ? <lucide.FileText size={24} /> : 
               <lucide.Smartphone size={24} />}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.25rem' }}>{s.name}</div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{s.description}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const HistoryScreen = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.post('/api/v1/customer/transactions/list', { page: 1, pageSize: 20 })
      .then(res => {
        setHistory(res.data.data.items || []);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="content">Đang tải lịch sử...</div>;

  return (
    <div className="content">
      <h2 className="mb-6">Lịch sử giao dịch</h2>
      <div style={{ background: 'rgba(15, 23, 42, 0.4)', borderRadius: '0.75rem', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
        {history.map(item => (
          <div key={item.id} className="history-item">
            <div className={`history-icon ${item.direction === 'sent' ? 'send' : 'receive'}`}>
              {item.direction === 'sent' ? <lucide.ArrowUpRight size={20} /> : <lucide.ArrowDownLeft size={20} />}
            </div>
            <div className="history-details">
              <div style={{ fontWeight: 500, marginBottom: '0.25rem' }}>{item.message || item.code}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {new Date(item.createdAt).toLocaleString()}
              </div>
            </div>
            <div className={`history-amount ${item.direction === 'sent' ? 'amount-neg' : 'amount-pos'}`}>
              {item.direction === 'sent' ? '-' : '+'}{item.amount.toLocaleString()} đ
            </div>
          </div>
        ))}
        {history.length === 0 && <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Chưa có giao dịch nào</div>}
      </div>
    </div>
  );
};

const ProfileScreen = ({ user, onLogout }) => {
  return (
    <div className="content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '2rem' }}>
      <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>
        {user?.displayName ? user.displayName.charAt(0) : 'U'}
      </div>
      <h2>{user?.displayName || 'Người dùng'}</h2>
      <p>{user?.phone}</p>
      
      <button className="btn btn-secondary mt-8" onClick={onLogout} style={{ color: 'var(--error)', borderColor: 'var(--error)' }}>
        <lucide.LogOut size={20} /> Đăng xuất
      </button>
    </div>
  );
};

const App = () => {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('home'); // home, history, profile
  const [selectedService, setSelectedService] = useState(null);

  // Initialize Lucide icons on updates
  useEffect(() => {
    if (window.lucide) {
      lucide.createIcons();
    }
  });

  if (!user) {
    return <AuthScreen onLogin={setUser} />;
  }

  return (
    <div className="app-container">
      <header className="header">
        <div>
          <p style={{ margin: 0, fontSize: '0.75rem' }}>Xin chào,</p>
          <h1 style={{ background: 'none', color: 'var(--text-main)', fontSize: '1rem' }}>{user.displayName}</h1>
        </div>
        <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-muted)' }}>
          <lucide.Bell size={24} />
        </div>
      </header>

      {selectedService ? (
        <ServiceFlow service={selectedService} onBack={() => setSelectedService(null)} />
      ) : (
        <>
          {activeTab === 'home' && <ServiceList onSelect={setSelectedService} />}
          {activeTab === 'history' && <HistoryScreen />}
          {activeTab === 'profile' && <ProfileScreen user={user} onLogout={() => setUser(null)} />}
        </>
      )}

      {/* Bottom Navigation */}
      {!selectedService && (
        <div className="bottom-nav">
          <div className={`nav-item ${activeTab === 'home' ? 'active' : ''}`} onClick={() => setActiveTab('home')}>
            <lucide.Home size={24} />
            <span>Trang chủ</span>
          </div>
          <div className={`nav-item ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
            <lucide.Clock size={24} />
            <span>Lịch sử</span>
          </div>
          <div className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
            <lucide.User size={24} />
            <span>Cá nhân</span>
          </div>
        </div>
      )}
    </div>
  );
};

const root = createRoot(document.getElementById('root'));
root.render(<App />);
