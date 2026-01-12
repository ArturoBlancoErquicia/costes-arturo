const n0 = (v) => {
  if (v === null || v === undefined) return 0;
  const s = String(v).trim().replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
};

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

export function computeCosting({
  lineas = [],
  unidades = 1,
  tiempos = { amasado: 0, velocidadFormado: 1, fermentacion: 0, coccion: 0 },
  config = {
    costeHoraPersonal: 0,
    costeHoraHorno: 0,
    gastosFijosMensuales: 0,
    horasTrabajoMensuales: 160,
    ivaDefecto: 4,
  },
  margen = 0,
  iva = 0,
  pvpManual = 0,
}) {
  const unidadesSafe = Math.max(1, Math.floor(n0(unidades) || 1));

  const totalMasa = lineas.reduce((acc, l) => acc + n0(l.cantidad), 0);
  const totalHarina = lineas.reduce((acc, l) => (l.esHarina ? acc + n0(l.cantidad) : acc), 0);

  // precio €/kg y cantidad en gramos
  const costeMP = lineas.reduce((acc, l) => acc + (n0(l.cantidad) / 1000) * n0(l.precio), 0);

  const costeHoraPersonal = n0(config.costeHoraPersonal);
  const costeHoraHorno = n0(config.costeHoraHorno);

  const costeAmasado = (n0(tiempos.amasado) / 60) * costeHoraPersonal;

  const velocidad = Math.max(1, n0(tiempos.velocidadFormado) || 1);
  const horasFormado = unidadesSafe / velocidad;
  const costeFormado = horasFormado * costeHoraPersonal;

  const costeCoccion = (n0(tiempos.coccion) / 60) * costeHoraHorno;

  const tiempoTotalCiclo =
    n0(tiempos.amasado) + horasFormado * 60 + n0(tiempos.fermentacion) + n0(tiempos.coccion);

  const gastosFijosMensuales = n0(config.gastosFijosMensuales);
  const horasTrabajoMensuales = Math.max(1, n0(config.horasTrabajoMensuales) || 1);
  const gastoGeneralMinuto = gastosFijosMensuales / (horasTrabajoMensuales * 60);

  const costeGG = tiempoTotalCiclo * gastoGeneralMinuto;

  const costeTotalLote = costeMP + costeAmasado + costeFormado + costeCoccion + costeGG;
  const costeUnitario = costeTotalLote / unidadesSafe;

  const margenNum = clamp(n0(margen), 0, 80);
  const ivaNum = clamp(n0(iva), 0, 30);

  const precioNetoSugerido = costeUnitario / (1 - margenNum / 100 || 1);
  const pvpSugerido = precioNetoSugerido * (1 + ivaNum / 100);

  const pvpManualNum = n0(pvpManual);
  const precioNetoManual = pvpManualNum / (1 + ivaNum / 100 || 1);

  const margenReal =
    precioNetoManual > 0 ? ((precioNetoManual - costeUnitario) / precioNetoManual) * 100 : 0;

  const beneficioDia = (precioNetoManual - costeUnitario) * unidadesSafe;

  return {
    unidadesSafe,
    totalMasa,
    totalHarina,
    costeMP,
    costeAmasado,
    costeFormado,
    costeCoccion,
    costeGG,
    costeTotalLote,
    costeUnitario,
    margenNum,
    ivaNum,
    pvpSugerido,
    margenReal,
    beneficioDia,
    tiempoTotalCiclo,
    horasFormado,
  };
}