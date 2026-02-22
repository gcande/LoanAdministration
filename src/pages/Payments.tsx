import { useEffect, useState, useCallback } from 'react';
import Layout from '../components/Layout';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { formatCurrency } from '../utils/finance';
import { Check, MessageSquare, Share2 } from 'lucide-react';
import jsPDF from 'jspdf';

const Payments = () => {
  const { id } = useParams();
  const [loan, setLoan] = useState<any>(null);
  const [cuotas, setCuotas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [activeCuota, setActiveCuota] = useState<any>(null);
  const [montoRecibido, setMontoRecibido] = useState(0);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);
  const [config, setConfig] = useState<any>(null);

  const fetchLoanDetails = useCallback(async () => {
    // Buscar configuración
    const { data: conf } = await supabase.from('configuracion').select('*');
    const configObj = conf?.reduce((acc: any, curr: any) => ({ ...acc, [curr.clave]: curr.valor }), {});
    setConfig(configObj);

    const { data: l } = await supabase
      .from('prestamos')
      .select('*, clientes(nombre, identificacion, telefono)')
      .eq('id', id)
      .single();
    
    const { data: c } = await supabase
      .from('cuotas')
      .select('*')
      .eq('prestamo_id', id)
      .order('numero_cuota', { ascending: true });

    setLoan(l);
    setCuotas(c || []);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchLoanDetails();
  }, [fetchLoanDetails]);

  const calculateLateFee = (cuota: any) => {
    if (!config) return 0;
    
    const hoy = new Date();
    const vencimiento = new Date(cuota.fecha_vencimiento);
    const diasGracia = Number(config.dias_gracia || 0);
    const tasaDiaria = Number(config.tasa_mora_diaria || 0) / 100;

    hoy.setHours(0,0,0,0);
    vencimiento.setHours(0,0,0,0);

    const diffTime = hoy.getTime() - vencimiento.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > diasGracia) {
      return Number(cuota.monto_cuota) * tasaDiaria * diffDays;
    }
    
    return 0;
  };

  const handleOpenPayment = (cuota: any) => {
    const calculatedFee = calculateLateFee(cuota);
    setActiveCuota({ ...cuota, current_late_fee: calculatedFee });
    setMontoRecibido(Number(cuota.monto_cuota) + calculatedFee);
    setShowModal(true);
  };

  const processPayment = async () => {
    try {
      const lateFeeToApply = activeCuota.current_late_fee || 0;
      
      // 1. Registrar Pago
      const { error: paymentError } = await supabase.from('pagos').insert([{
        prestamo_id: id,
        cuota_id: activeCuota.id,
        monto_pagado: montoRecibido,
        metodo_pago: 'Efectivo',
        aplicado_a_mora: lateFeeToApply,
        aplicado_a_interes: activeCuota.monto_interes,
        aplicado_a_capital: montoRecibido - lateFeeToApply - activeCuota.monto_interes
      }]);

      if (paymentError) throw paymentError;

      // 2. Actualizar Cuota
      const { error: cuotaError } = await supabase.from('cuotas').update({
        estado: 'pagado',
        fecha_pago: new Date().toISOString(),
        mora_acumulada: lateFeeToApply
      }).eq('id', activeCuota.id);

      if (cuotaError) throw cuotaError;

      // 3. Actualizar Saldo Préstamo
      const capitalPagado = montoRecibido - lateFeeToApply - activeCuota.monto_interes;
      const nuevoSaldo = loan.saldo_pendiente - capitalPagado;
      
      await supabase.from('prestamos').update({
        saldo_pendiente: Math.max(0, nuevoSaldo),
        estado: nuevoSaldo <= 0 ? 'pagado' : 'activo'
      }).eq('id', id);

      setReceiptData({
        cliente: loan.clientes.nombre,
        telefono: loan.clientes.telefono,
        cuotaNr: activeCuota.numero_cuota,
        monto: montoRecibido,
        mora: lateFeeToApply,
        fecha: new Date().toLocaleString('es-CO'),
        empresa: config.nombre_empresa || 'PrestaYa'
      });

      setShowModal(false);
      setShowReceipt(true);
      fetchLoanDetails();
    } catch (error) {
      console.error(error);
      alert('Error al registrar el pago');
    }
  };

  const generatePDF = () => {
    if (!receiptData) return;

    const doc = new jsPDF({
      unit: 'mm',
      format: [80, 150]
    });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(receiptData.empresa.toUpperCase(), 40, 15, { align: 'center' });
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('NIT: 900.123.456-1', 40, 20, { align: 'center' });
    doc.text('------------------------------------------', 40, 25, { align: 'center' });
    
    doc.setFont('helvetica', 'bold');
    doc.text('COMPROBANTE DE PAGO', 40, 32, { align: 'center' });
    doc.text(`Recibo: #${Math.floor(Math.random() * 9000) + 1000}`, 40, 37, { align: 'center' });
    doc.text('------------------------------------------', 40, 42, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.text(`Fecha: ${receiptData.fecha}`, 10, 50);
    doc.text(`Cliente: ${receiptData.cliente}`, 10, 55);
    doc.text(`Identificación: ${loan.clientes.identificacion}`, 10, 60);
    
    doc.text('------------------------------------------', 40, 72, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.text('DETALLE DEL PAGO', 10, 80);
    doc.setFont('helvetica', 'normal');
    doc.text(`Cuota N°:`, 10, 87);
    doc.text(`${receiptData.cuotaNr}`, 70, 87, { align: 'right' });
    
    doc.text(`Abono a Capital:`, 10, 92);
    doc.text(`${formatCurrency(receiptData.monto - (activeCuota.monto_interes || 0) - receiptData.mora)}`, 70, 92, { align: 'right' });
    
    doc.text(`Abono a Interés:`, 10, 97);
    doc.text(`${formatCurrency(activeCuota.monto_interes || 0)}`, 70, 97, { align: 'right' });
    
    if (receiptData.mora > 0) {
      doc.text(`Mora / Recargos:`, 10, 102);
      doc.text(`${formatCurrency(receiptData.mora)}`, 70, 102, { align: 'right' });
    }

    doc.text('------------------------------------------', 40, 110, { align: 'center' });
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL PAGADO:', 10, 118);
    doc.text(`${formatCurrency(receiptData.monto)}`, 70, 118, { align: 'right' });

    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text('¡Gracias por su puntualidad!', 40, 140, { align: 'center' });
    doc.text('Generado por PrestaYa Digital', 40, 144, { align: 'center' });

    return doc;
  };

  const handleSharePDF = async () => {
    const doc = generatePDF();
    if (!doc) return;

    const pdfBlob = doc.output('blob');
    const file = new File([pdfBlob], `Recibo_${receiptData.cliente}.pdf`, { type: 'application/pdf' });

    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: 'Recibo de Pago',
          text: `Recibo de pago - ${receiptData.empresa}`
        });
      } catch (error) {
        doc.save(`Recibo_${receiptData.cliente}.pdf`);
      }
    } else {
      doc.save(`Recibo_${receiptData.cliente}.pdf`);
      alert('PDF descargado. Ahora puedes compartirlo.');
    }
  };

  if (loading) return <Layout title="Pagos">Cargando...</Layout>;

  return (
    <Layout title="Gestión de Pagos">
      <div className="card loan-summary">
        <div className="summary-header">
          <div>
            <h3>{loan.clientes.nombre}</h3>
            <p>CC: {loan.clientes.identificacion}</p>
          </div>
          <div className="balance">
            <span>Saldo Pendiente</span>
            <h2>{formatCurrency(loan.saldo_pendiente)}</h2>
          </div>
        </div>
      </div>

      <div className="section-title">
        <h4>Cronograma de Cuotas</h4>
      </div>

      <div className="cuotas-list">
        {cuotas.map(cuota => {
          const moraActual = cuota.estado !== 'pagado' ? calculateLateFee(cuota) : (cuota.mora_acumulada || 0);
          return (
            <div key={cuota.id} className={`cuota-item ${cuota.estado}`}>
              <div className="cuota-nr">{cuota.numero_cuota}</div>
              <div className="cuota-info">
                <strong>{formatCurrency(cuota.monto_cuota)}</strong>
                <span>Vence: {cuota.fecha_vencimiento}</span>
                {moraActual > 0 && <span className="mora-tag">Mora: {formatCurrency(moraActual)}</span>}
              </div>
              <div className="cuota-action">
                {cuota.estado === 'pagado' ? (
                  <div className="paid-icon"><Check size={20} /></div>
                ) : (
                  <button className="btn btn-primary btn-sm" onClick={() => handleOpenPayment(cuota)}>
                    Pagar
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade">
            <h3>Registrar Pago</h3>
            <p className="text-secondary">Cuota #{activeCuota.numero_cuota}</p>
            
            <div className="payment-details">
              <div className="detail-row">
                <span>Valor Cuota:</span>
                <span>{formatCurrency(activeCuota.monto_cuota)}</span>
              </div>
              <div className="detail-row">
                <span>Interés por Mora:</span>
                <span className="text-danger">{formatCurrency(activeCuota.current_late_fee || 0)}</span>
              </div>
              <hr />
              <div className="detail-row total">
                <span>Total Sugerido:</span>
                <span>{formatCurrency(Number(activeCuota.monto_cuota) + (activeCuota.current_late_fee || 0))}</span>
              </div>
            </div>

            <div className="form-group mt-4">
              <label>Monto a Recibir</label>
              <input 
                type="number" 
                value={montoRecibido} 
                onChange={e => setMontoRecibido(Number(e.target.value))}
              />
            </div>

            <div className="modal-actions">
              <button className="btn" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={processPayment}>Confirmar Pago</button>
            </div>
          </div>
        </div>
      )}

      {showReceipt && receiptData && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade">
            <div className="receipt-header">
              <div className="success-badge">
                <Check size={32} />
              </div>
              <h3>¡Pago Exitoso!</h3>
              <p>El comprobante ha sido generado</p>
            </div>

            <div className="receipt-box">
              <div className="receipt-row">
                <span>Empresa:</span>
                <strong>{receiptData.empresa}</strong>
              </div>
              <div className="receipt-row">
                <span>Cliente:</span>
                <strong>{receiptData.cliente}</strong>
              </div>
              <div className="receipt-row">
                <span>Concepto:</span>
                <strong>Cuota #{receiptData.cuotaNr}</strong>
              </div>
              <div className="receipt-row">
                <span>Fecha:</span>
                <strong>{receiptData.fecha}</strong>
              </div>
              <hr />
              <div className="receipt-row total">
                <span>Monto Pagado:</span>
                <strong>{formatCurrency(receiptData.monto)}</strong>
              </div>
            </div>

            <div className="modal-actions-vertical">
              <button className="btn btn-primary w-full" onClick={handleSharePDF}>
                <Share2 size={20} />
                Descargar y Compartir PDF
              </button>

              <button 
                className="btn btn-whatsapp w-full"
                onClick={() => {
                  const message = `*RECIBO DE PAGO - ${receiptData.empresa}*%0A%0A` +
                    `Hola *${receiptData.cliente}*, confirmamos tu pago:%0A%0A` +
                    `✅ *Concepto:* Cuota #${receiptData.cuotaNr}%0A` +
                    `✅ *Monto:* ${formatCurrency(receiptData.monto)}%0A` +
                    `✅ *Fecha:* ${receiptData.fecha}%0A%0A` +
                    `¡Gracias por tu puntualidad!`;
                  const phone = receiptData.telefono?.replace(/\D/g, '') || '';
                  window.open(`https://wa.me/57${phone}?text=${message}`, '_blank');
                }}
              >
                <MessageSquare size={20} />
                Enviar Mensaje WhatsApp
              </button>
              
              <button className="btn btn-outline w-full" onClick={() => setShowReceipt(false)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}


    </Layout>
  );
};

export default Payments;

