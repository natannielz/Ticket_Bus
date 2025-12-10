@extends('layouts.app')

@section('content')
<div class="mb-5">
  <div class="d-flex align-items-center mb-4">
    <i class="fas fa-user-circle" style="font-size: 3rem; color: #667eea; margin-right: 1rem;"></i>
    <div>
      <h2>Selamat datang, {{ auth()->user()->name }}!</h2>
      <p class="text-muted">Nikmati layanan penyewaan bus terbaik</p>
    </div>
  </div>
</div>

<!-- Stats Row -->
<div class="row mb-4">
  <div class="col-md-3 mb-3">
    <div class="card text-center" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
      <div class="card-body">
        <i class="fas fa-calendar-check" style="font-size: 2.5rem; margin-bottom: 1rem;"></i>
        <h5>Total Booking</h5>
        <p style="font-size: 2rem; font-weight: bold;">{{ $totalBookings }}</p>
      </div>
    </div>
  </div>
  <div class="col-md-3 mb-3">
    <div class="card text-center" style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white;">
      <div class="card-body">
        <i class="fas fa-hourglass-half" style="font-size: 2.5rem; margin-bottom: 1rem;"></i>
        <h5>Menunggu</h5>
        <p style="font-size: 2rem; font-weight: bold;">{{ $pendingBookings }}</p>
      </div>
    </div>
  </div>
  <div class="col-md-3 mb-3">
    <div class="card text-center" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white;">
      <div class="card-body">
        <i class="fas fa-check-circle" style="font-size: 2.5rem; margin-bottom: 1rem;"></i>
        <h5>Selesai</h5>
        <p style="font-size: 2rem; font-weight: bold;">{{ $completedBookings }}</p>
      </div>
    </div>
  </div>
  <div class="col-md-3 mb-3">
    <div class="card text-center" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white;">
      <div class="card-body">
        <i class="fas fa-money-bill-wave" style="font-size: 2.5rem; margin-bottom: 1rem;"></i>
        <h5>Total Biaya</h5>
        <p style="font-size: 1.8rem; font-weight: bold;">Rp {{ number_format($totalSpent, 0, ',', '.') }}</p>
      </div>
    </div>
  </div>
</div>

<!-- Quick Actions -->
<div class="row mb-4">
  <div class="col-md-6">
    <div class="card" style="border-left: 4px solid #667eea;">
      <div class="card-body">
        <h5><i class="fas fa-plus-circle"></i> Pesan Bus</h5>
        <p class="text-muted">Pesan bus baru untuk perjalanan Anda</p>
        <a href="{{ route('bookings.create') }}" class="btn btn-primary">
          <i class="fas fa-arrow-right"></i> Buat Booking
        </a>
      </div>
    </div>
  </div>
  <div class="col-md-6">
    <div class="card" style="border-left: 4px solid #11998e;">
      <div class="card-body">
        <h5><i class="fas fa-list"></i> Transaksi Saya</h5>
        <p class="text-muted">Lihat riwayat booking dan transaksi</p>
        <a href="{{ route('bookings.index') }}" class="btn btn-success">
          <i class="fas fa-arrow-right"></i> Lihat Transaksi
        </a>
      </div>
    </div>
  </div>
</div>

<!-- Recent Bookings -->
@if($recentBookings->count() > 0)
<div class="card">
  <div class="card-header" style="background: linear-gradient(90deg, #2c3e50 0%, #34495e 100%); color: white;">
    <h5 class="mb-0"><i class="fas fa-history"></i> Booking Terbaru</h5>
  </div>
  <div class="card-body">
    <div class="table-responsive">
      <table class="table table-hover">
        <thead>
          <tr>
            <th>Bus</th>
            <th>Tanggal</th>
            <th>Kursi</th>
            <th>Total Harga</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          @foreach($recentBookings as $booking)
            <tr style="cursor: pointer;">
              <td><strong>{{ $booking->armada->name ?? '-' }}</strong></td>
              <td>{{ \Carbon\Carbon::parse($booking->date)->format('d M Y') }}</td>
              <td><span class="badge bg-info">{{ $booking->seats }}</span></td>
              <td><strong>Rp {{ number_format($booking->total_price, 0, ',', '.') }}</strong></td>
              <td>
                @if($booking->status == 'pending')
                  <span class="badge bg-warning">Menunggu</span>
                @elseif($booking->status == 'confirmed')
                  <span class="badge bg-success">Konfirmasi</span>
                @elseif($booking->status == 'completed')
                  <span class="badge bg-info">Selesai</span>
                @else
                  <span class="badge bg-danger">{{ ucfirst($booking->status) }}</span>
                @endif
              </td>
            </tr>
          @endforeach
        </tbody>
      </table>
    </div>
  </div>
</div>
@else
<div class="alert alert-info" style="text-align: center;">
  <i class="fas fa-info-circle"></i> Anda belum membuat booking. <a href="{{ route('bookings.create') }}" class="alert-link">Mulai pesan sekarang!</a>
</div>
@endif

@endsection
