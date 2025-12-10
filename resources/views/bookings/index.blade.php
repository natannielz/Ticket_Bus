@extends('layouts.app')

@section('content')
<div class="d-flex justify-content-between align-items-center mb-4">
  <div>
    <h2><i class="fas fa-history"></i> Transaksi Saya</h2>
    <p class="text-muted">Riwayat dan detail semua booking Anda</p>
  </div>
  <a href="{{ route('bookings.create') }}" class="btn btn-success btn-lg">
    <i class="fas fa-plus"></i> Booking Baru
  </a>
</div>

<div class="card">
  <div class="card-header" style="background: linear-gradient(90deg, #2c3e50 0%, #34495e 100%); color: white;">
    <h5 class="mb-0"><i class="fas fa-list"></i> Daftar Booking</h5>
  </div>
  <div class="card-body">
    @if($bookings->count() > 0)
      <div class="table-responsive">
        <table class="table table-hover">
          <thead>
            <tr>
              <th>ID</th>
              <th>Rute</th>
              <th>Bus</th>
              <th>Tanggal</th>
              <th>Kursi</th>
              <th>Total Harga</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            @foreach($bookings as $booking)
              <tr>
                <td><strong>#{{ $booking->id }}</strong></td>
                <td>
                  <i class="fas fa-route" style="color: #11998e; margin-right: 0.5rem;"></i>
                  {{ $booking->route->name ?? '-' }}
                  <small class="d-block text-muted">{{ $booking->route->distance ?? '-' }} km</small>
                </td>
                <td>
                  <i class="fas fa-bus" style="color: #667eea; margin-right: 0.5rem;"></i>
                  {{ $booking->armada->name ?? '-' }}
                </td>
                <td>{{ \Carbon\Carbon::parse($booking->date)->format('d M Y') }}</td>
                <td><span class="badge bg-info">{{ $booking->seats }}</span></td>
                <td><strong>Rp {{ number_format($booking->total_price, 0, ',', '.') }}</strong></td>
                <td>
                  @if($booking->status == 'pending')
                    <span class="badge bg-warning"><i class="fas fa-clock"></i> Menunggu</span>
                  @elseif($booking->status == 'confirmed')
                    <span class="badge bg-success"><i class="fas fa-check"></i> Konfirmasi</span>
                  @elseif($booking->status == 'completed')
                    <span class="badge bg-info"><i class="fas fa-check-double"></i> Selesai</span>
                  @else
                    <span class="badge bg-danger"><i class="fas fa-times"></i> {{ ucfirst($booking->status) }}</span>
                  @endif
                </td>
              </tr>
            @endforeach
          </tbody>
        </table>
      </div>
    @else
      <div class="alert alert-info text-center">
        <i class="fas fa-info-circle"></i> Anda belum membuat booking. <a href="{{ route('bookings.create') }}" class="alert-link">Pesan sekarang!</a>
      </div>
    @endif
  </div>
</div>

@endsection
