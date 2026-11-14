// Placeholder del App Shell mientras llega el contenido que depende de `params`
// (Partial Prefetching: la lectura de URL data debe ir dentro de <Suspense>).
export function RouteLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{ minHeight: "60vh", display: "grid", placeItems: "center" }}
    >
      <div className="pixel neon-cyan" style={{ fontSize: 12, letterSpacing: "0.2em" }}>
        CARGANDO_
      </div>
    </div>
  );
}
