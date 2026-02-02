<div className="container">
  <h1 style={{ fontSize: 32, fontWeight: "bold" }}>
    Financial Planner MVP
  </h1>

  <p>Total Balance: {total}</p>

  <div>
    <div className="card income">Income</div>
    <div className="card expense">Expense</div>
  </div>

  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
    <div className="month">January</div>
    <div className="month">February</div>
    <div className="month">March</div>
  </div>
</div>
