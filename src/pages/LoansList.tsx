import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';
import { formatCurrency } from '../utils/finance';
import { Search, CreditCard, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

const LoansList = () => {
  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchLoans();
  }, []);

  const fetchLoans = async () => {
    const { data, error } = await supabase
      .from('prestamos')
      .select(`
        *,
        clientes (nombre, identificacion),
        planes_prestamo (nombre_plan)
      `)
      .order('created_at', { ascending: false });

    if (!error) setLoans(data || []);
    setLoading(false);
  };

  const filteredLoans = loans.filter(l => 
    l.clientes.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
    l.clientes.identificacion.includes(searchTerm)
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'activo': return <span className="badge badge-info">Al día</span>;
      case 'en_mora': return <span className="badge badge-danger">En Mora</span>;
      case 'pagado': return <span className="badge badge-success">Pagado</span>;
      default: return <span className="badge">{status}</span>;
    }
  };

  return (
    <Layout title="Préstamos">
      <div className="search-bar">
        <div className="search-input">
          <Search size={20} />
          <input 
            type="text" 
            placeholder="Buscar por cliente..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="loans-list">
        {loading ? (
          <p>Cargando...</p>
        ) : filteredLoans.map(loan => (
          <div key={loan.id} className="card loan-card">
            <div className="loan-header">
              <div>
                <h4>{loan.clientes.nombre}</h4>
                <p className="text-secondary">{loan.planes_prestamo.nombre_plan}</p>
              </div>
              {getStatusBadge(loan.estado)}
            </div>

            <div className="loan-body">
              <div className="loan-stat">
                <span>Monto</span>
                <strong>{formatCurrency(loan.monto_prestado)}</strong>
              </div>
              <div className="loan-stat">
                <span>Saldo</span>
                <strong className="text-primary">{formatCurrency(loan.saldo_pendiente)}</strong>
              </div>
              <div className="loan-stat">
                <span>Cuotas</span>
                <strong>{loan.num_cuotas}</strong>
              </div>
            </div>

            <div className="loan-footer">
              <div className="loan-date">
                <Calendar size={14} />
                <span>Inició: {loan.fecha_inicio}</span>
              </div>
              <Link to={`/pagos/${loan.id}`} className="btn btn-primary btn-sm">
                <CreditCard size={18} />
                Pagos
              </Link>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .loan-card {
          padding: 16px;
        }

        .loan-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
        }

        .loan-body {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          padding: 12px 0;
          border-top: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
          margin-bottom: 12px;
        }

        .loan-stat {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .loan-stat span {
          font-size: 11px;
          color: #64748b;
          text-transform: uppercase;
        }

        .loan-stat strong {
          font-size: 14px;
        }

        .loan-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .loan-date {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: #64748b;
        }

        .btn-sm {
          padding: 8px 16px;
          font-size: 13px;
        }
      `}</style>
    </Layout>
  );
};

export default LoansList;
