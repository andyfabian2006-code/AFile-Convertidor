// Llamar SOLO cuando una conversión termine con éxito.
// tipo: minúsculas, números y guiones. Ej: 'png-to-jpg'
export async function registrarConversion(tipo) {
  try {
    const res = await fetch('/api/stats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: tipo })
    });
    
    if (!res.ok) {
      console.warn('Estadística no guardada:', res.statusText);
    }
  } catch (e) {
    // Las estadísticas nunca deben romper la conversión del usuario
  }
}
