import React from 'react';

const SeatMap = ({ capacity = 40, bookedSeats = [], selectedSeats = [], onSeatClick, config = '2-2', price = 0 }) => {
  // Helper to generate seat labels (1A, 1B, 2A, 2B...)
  const generateSeats = () => {
    const rows = Math.ceil(capacity / 4); // Standard 4 seats per row
    const seats = [];

    // Layout configurations
    const layouts = {
      '2-2': { col: ['A', 'B', 'C', 'D'], aisle: 2 },
      '1-1': { col: ['A', 'B'], aisle: 1 },
      '2-1': { col: ['A', 'B', 'C'], aisle: 2 }
    };

    const currentLayout = layouts[config] || layouts['2-2'];
    const cols = currentLayout.col;
    const aisleAfter = currentLayout.aisle;

    for (let r = 1; r <= rows; r++) {
      let rowSeats = [];
      cols.forEach((letter, idx) => {
        // Skip some seats if capacity is reached (last row might be partial)
        if ((r - 1) * cols.length + idx >= capacity) return;

        const seatId = `${r}${letter}`;
        rowSeats.push(seatId);
      });
      seats.push({ row: r, items: rowSeats, aisleAfter });
    }
    return seats;
  };

  const rows = generateSeats();

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 w-full max-w-md mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-gray-900">Select Seats</h3>
        <div className="flex gap-4 text-xs font-semibold text-gray-500">
          <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-white border border-gray-300"></div> Available</div>
          <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-gray-300"></div> Booked</div>
          <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-black"></div> Selected</div>
        </div>
      </div>

      {/* Driver Position */}
      <div className="flex justify-end mb-8 px-8">
        <div className="w-12 h-12 rounded-full border-2 border-gray-200 flex items-center justify-center text-gray-400">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
        </div>
      </div>

      <div className="space-y-3">
        {rows.map((rowData, rIdx) => (
          <div key={rIdx} className="flex justify-between items-center gap-4">
            {rowData.items.map((seatId, sIdx) => {
              const isBooked = bookedSeats.includes(seatId);
              const isSelected = selectedSeats.includes(seatId);

              // Add aisle spacer
              const showAisle = sIdx === rowData.aisleAfter;

              return (
                <React.Fragment key={seatId}>
                  {showAisle && <div className="w-8"></div>}
                  <button
                    disabled={isBooked}
                    onClick={() => onSeatClick(seatId)}
                    className={`
                                    w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold transition-all duration-200
                                    ${isBooked
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : isSelected
                          ? 'bg-black text-white shadow-lg scale-110'
                          : 'bg-white border hover:border-black text-gray-700 hover:shadow-md'}
                                `}
                  >
                    {seatId}
                  </button>
                </React.Fragment>
              );
            })}
          </div>
        ))}
      </div>

      <div className="mt-8 pt-6 border-t border-gray-100">
        <div className="flex justify-between items-center">
          <span className="text-sm font-semibold text-gray-500">Selected ({selectedSeats.length})</span>
          <span className="text-xl font-bold">Rp {(price * selectedSeats.length).toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};

export default SeatMap;
