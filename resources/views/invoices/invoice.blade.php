<!doctype html>
<html lang="en">

<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Invoice #{{ $booking->id }}</title>
  <style>
    body {
      font-family: DejaVu Sans, Arial, Helvetica, sans-serif;
      color: #333;
    }

    .invoice-box {
      max-width: 800px;
      margin: auto;
      padding: 30px;
      border: 1px solid #eee;
    }

    .top {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .company {
      font-size: 1.4rem;
      font-weight: bold;
    }

    .meta {
      text-align: right;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }

    table th,
    table td {
      border: 1px solid #ddd;
      padding: 8px;
    }

    table th {
      background: #f7f7f7;
    }

    .total {
      text-align: right;
      font-weight: bold;
    }

    .notes {
      margin-top: 20px;
      font-size: 0.9rem;
      color: #666;
    }
  </style>
</head>

<body>
  <div class="invoice-box">
    <div class="top">
      <div>
        <div class="company">Sewa Bus</div>
        <div>Jl. Contoh No.1, Kota</div>
        <div>Telp: 0812-xxxx-xxxx</div>
        <div>Email: admin@sewa.test</div>
      </div>
      <div class="meta">
        <div>Invoice #: <strong>{{ $booking->id }}</strong></div>
        <div>Tanggal: {{ \Carbon\Carbon::parse($booking->created_at)->format('d M Y') }}</div>
        <div>Status: {{ ucfirst($booking->status) }}</div>
      </div>
    </div>

    <hr>

    <div style="display:flex; justify-content:space-between; margin-top:10px;">
      <div>
        <strong>Bill To:</strong>
        <div>{{ $booking->user->name }}</div>
        <div>{{ $booking->user->email }}</div>
      </div>
      <div>
        <strong>Detail:</strong>
        <div>Bus: {{ $booking->armada->name }}</div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width:60%;">Deskripsi</th>
          <th style="width:10%;">Kuantitas</th>
          <th style="width:15%;">Harga Satuan</th>
          <th style="width:15%;">Jumlah</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Biaya sewa bus - {{ $booking->armada->name }}</td>
          <td style="text-align:center;">{{ $booking->seats }}</td>
          <td style="text-align:right;">Rp {{ number_format($booking->armada->price_per_km, 0, ',', '.') }}</td>
          <td style="text-align:right;">Rp {{ number_format($booking->total_price, 0, ',', '.') }}</td>
        </tr>
      </tbody>
      <tfoot>
        <tr>
          <td colspan="3" class="total">Total</td>
          <td style="text-align:right;">Rp {{ number_format($booking->total_price, 0, ',', '.') }}</td>
        </tr>
      </tfoot>
    </table>

    <div class="notes">
      <strong>Catatan:</strong>
      <p>Terima kasih telah menggunakan layanan kami. Mohon simpan invoice ini sebagai bukti pembayaran.</p>
    </div>
  </div>
</body>

</html>