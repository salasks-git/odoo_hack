import React from 'react';

const Table = ({
  columns,
  data = [],
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search...',
  filterComponent,
  onAddNew,
  addNewLabel = 'Add New',
  actions,
  keyField = 'id'
}) => {
  return (
    <div className="card">
      <div className="table-controls">
        {onSearchChange && (
          <input
            type="text"
            className="form-control"
            style={{ maxWidth: '300px' }}
            placeholder={searchPlaceholder}
            value={searchValue || ''}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        )}
        {filterComponent}
        <div style={{ marginLeft: 'auto' }}>
          {onAddNew && (
            <button className="btn btn-primary" onClick={onAddNew}>
              {addNewLabel}
            </button>
          )}
        </div>
      </div>

      <div className="table-responsive">
        <table>
          <thead>
            <tr>
              {columns.map((col, index) => (
                <th key={index}>{col.header}</th>
              ))}
              {actions && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (actions ? 1 : 0)} style={{ textAlign: 'center', padding: '2rem' }}>
                  No records found.
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr key={row[keyField]}>
                  {columns.map((col, index) => (
                    <td key={index}>
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                  {actions && <td>{actions(row)}</td>}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Table;

