@extends('layouts.app')

@section('content')
<div class="d-flex justify-content-between align-items-center mb-4">
  <div>
    <h2><i class="fas fa-file-alt"></i> Detail Booking #{{ $booking->id }}</h2>
  </div>
  <a href="{{ route('admin.bookings.index') }}" class="btn btn-secondary btn-lg">
    <i class="fas fa-arrow-left"></i> Kembali
  </a>
</div>

<div class="row">
  <div class="col-md-8">
    <div class="card mb-4" style="border-top: 4px solid #667eea;">
      <div class="card-header" style="background: linear-gradient(90deg, #2c3e50 0%, #34495e 100%); color: white;">
        <h5 class="mb-0"><i class="fas fa-info-circle"></i> Informasi Booking</h5>
      </div>
      <div class="card-body">
        <div class="row mb-3">
          <div class="col-md-6">
            <label class="form-label"><strong><i class="fas fa-user"></i> Nama Pengguna</strong></label>
            <p>{{ $booking->user->name }}</p>
          </div>
          <div class="col-md-6">
            <label class="form-label"><strong><i class="fas fa-envelope"></i> Email</strong></label>
            <p>{{ $booking->user->email }}</p>
          </div>
        </div>
        <div class="row mb-3">
          <div class="col-md-6">
            <label class="form-label"><strong><i class="fas fa-route"></i> Rute</strong></label>
            <p>{{ $booking->route->name }} ({{ $booking->route->distance }} km)</p>
          </div>
          <div class="col-md-6">
            <label class="form-label"><strong><i class="fas fa-bus"></i> Bus</strong></label>
            <p>{{ $booking->armada->name }}</p>
          </div>
        </div>
        <div class="row mb-3">
          <div class="col-md-6">
            <label class="form-label"><strong><i class="fas fa-calendar-alt"></i> Tanggal Perjalanan</strong></label>
            <p>{{ \Carbon\Carbon::parse($booking->date)->format('d M Y') }}</p>
          </div>
          <div class="col-md-6">
            <label class="form-label"><strong><i class="fas fa-users"></i> Jumlah Kursi</strong></label>
            <p><span class="badge bg-info">{{ $booking->seats }}</span></p>
          </div>
        </div>
        <div class="row mb-3">
          <div class="col-md-6">
            <label class="form-label"><strong><i class="fas fa-map-marker-alt"></i> Keberangkatan</strong></label>
            <p>{{ $booking->from ?? '-' }}</p>
          </div>
          <div class="col-md-6">
            <label class="form-label"><strong><i class="fas fa-location-arrow"></i> Tujuan</strong></label>
            <p>{{ $booking->to ?? '-' }}</p>
          </div>
        </div>
      </div>
    </div>

    <div class="card" style="border-top: 4px solid #11998e;">
      <div class="card-header" style="background: linear-gradient(90deg, #2c3e50 0%, #34495e 100%); color: white;">
        <h5 class="mb-0"><i class="fas fa-money-bill-wave"></i> Ringkasan Pembayaran</h5>
      </div>
      <div class="card-body">
        <div class="row">
          <div class="col-md-6">
            <label class="form-label"><strong>Harga per Kursi</strong></label>
            <p>Rp {{ number_format($booking->armada->price_per_km, 0, ',', '.') }}</p>
          </div>
          <div class="col-md-6">
            <label class="form-label"><strong>Jumlah Kursi</strong></label>
            <p>{{ $booking->seats }}</p>
          </div>
        </div>
        <hr>
        <div class="row">
          <div class="col-md-12">
            <label class="form-label"><strong style="font-size: 1.3rem;">Total Harga</strong></label>
            <p style="font-size: 1.5rem; color: #11998e; font-weight: bold;">Rp {{ number_format($booking->total_price, 0, ',', '.') }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="col-md-4">
    <div class="card" style="border-top: 4px solid #764ba2;">
      <div class="card-header" style="background: linear-gradient(90deg, #2c3e50 0%, #34495e 100%); color: white;">
        <h5 class="mb-0"><i class="fas fa-tasks"></i> Status & Aksi</h5>
      </div>
      <div class="card-body">
        <div class="mb-3">
          <label class="form-label"><strong>Status Saat Ini</strong></label>
          <div>
            @if($booking->status == 'pending')
              <span class="badge bg-warning" style="font-size: 1rem; padding: 0.5rem 1rem;">
                <i class="fas fa-clock"></i> Menunggu Konfirmasi
              </span>
            @elseif($booking->status == 'confirmed')
              <span class="badge bg-success" style="font-size: 1rem; padding: 0.5rem 1rem;">
                <i class="fas fa-check"></i> Dikonfirmasi
              </span>
            @elseif($booking->status == 'completed')
              <span class="badge bg-info" style="font-size: 1rem; padding: 0.5rem 1rem;">
                <i class="fas fa-check-double"></i> Selesai
              </span>
            @else
              <span class="badge bg-danger" style="font-size: 1rem; padding: 0.5rem 1rem;">
                <i class="fas fa-times"></i> {{ ucfirst($booking->status) }}
              </span>
            @endif
          </div>
        </div>

        @if($booking->status == 'pending')
          <form action="{{ route('admin.bookings.updateStatus', $booking) }}" method="POST" class="mb-2">
            @csrf
            <input type="hidden" name="status" value="confirmed">
            <button class="btn btn-success w-100 mb-2">
              <i class="fas fa-check-circle"></i> Terima Booking
            </button>
          </form>
        @endif

        @if($booking->status != 'completed')
          <form action="{{ route('admin.bookings.updateStatus', $booking) }}" method="POST" class="mb-2">
            @csrf
            <input type="hidden" name="status" value="completed">
            <button class="btn btn-info w-100 mb-2">
              <i class="fas fa-check-double"></i> Tandai Selesai
            </button>
          </form>
        @endif

        <form action="{{ route('admin.bookings.updateStatus', $booking) }}" method="POST" class="mb-2">
          @csrf
          <input type="hidden" name="status" value="cancelled">
          <button class="btn btn-warning w-100 mb-2" onclick="return confirm('Yakin ingin membatalkan booking?')">
            <i class="fas fa-ban"></i> Batalkan
          </button>
        </form>

        <form action="{{ route('admin.bookings.destroy', $booking) }}" method="POST">
          @csrf @method('DELETE')
          <button class="btn btn-danger w-100" onclick="return confirm('Yakin ingin menghapus booking ini?')">
            <i class="fas fa-trash"></i> Hapus
          </button>
        </form>
        <a href="{{ route('admin.bookings.invoice', $booking) }}" target="_blank" class="btn btn-primary w-100 mt-2">
          <i class="fas fa-file-pdf"></i> Cetak Invoice
        </a>
      </div>
    </div>

    <div class="card mt-3" style="border-top: 4px solid #f5576c;">
      <div class="card-header" style="background: linear-gradient(90deg, #2c3e50 0%, #34495e 100%); color: white;">
        <h5 class="mb-0"><i class="fas fa-clock"></i> Tanggal</h5>
      </div>
      <div class="card-body">
        <p><small class="text-muted">Dibuat pada:</small><br>{{ \Carbon\Carbon::parse($booking->created_at)->format('d M Y H:i') }}</p>
        <p><small class="text-muted">Diperbarui pada:</small><br>{{ \Carbon\Carbon::parse($booking->updated_at)->format('d M Y H:i') }}</p>
      </div>
    </div>
  </div>
</div>

@endsection
