import React, { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./FiltroSidebar.css";

function FiltroSidebar({ visible, onClose, onFilter }) {
  const [dateRange, setDateRange] = useState([null, null]);
  const [startDate, endDate] = dateRange;
  const [filtros, setFiltros] = useState({
    temperatura: "Todas",
    responsavel: "",
    origem: "Todas",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFiltros((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onFilter({
      ...filtros,
      dataInicio: startDate,
      dataFim: endDate,
    });
    onClose();
  };

  if (!visible) return null;

  return (
    <div className="sidebar-overlay">
      <div className="sidebar">
        <h2>Filtrar Leads</h2>
        <form onSubmit={handleSubmit} className="filtro-form">
          <label>
            Intervalo de datas:
            <DatePicker
              selectsRange={true}
              startDate={startDate}
              endDate={endDate}
              onChange={(update) => {
                setDateRange(update);
              }}
              isClearable={true}
              placeholderText="Selecione o período"
              dateFormat="dd/MM/yyyy"
            />
          </label>

          <label>
            Temperatura:
            <select name="temperatura" value={filtros.temperatura} onChange={handleChange}>
              <option value="Todas">Todas</option>
              <option value="Quente">Quente</option>
              <option value="Morno">Morno</option>
              <option value="Frio">Frio</option>
            </select>
          </label>

          <label>
            Responsável:
            <input
              type="text"
              name="responsavel"
              value={filtros.responsavel}
              onChange={handleChange}
              placeholder="Nome do vendedor"
            />
          </label>

          <label>
            Origem:
            <select name="origem" value={filtros.origem} onChange={handleChange}>
              <option value="Todas">Todas</option>
              <option value="OLX">OLX</option>
              <option value="Webmotors">Webmotors</option>
              <option value="Facebook">Facebook</option>
              <option value="Instagram">Instagram</option>
              <option value="ICarros">ICarros</option>
            </select>
          </label>

          <div className="botoes">
            <button type="submit">Aplicar Filtros</button>
            <button type="button" onClick={onClose}>Fechar</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default FiltroSidebar;