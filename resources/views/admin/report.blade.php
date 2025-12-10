@extends('layouts.app')

@section('content')
<div class="mb-4">
  <h2><i class="fas fa-file-alt"></i> Laporan Transaksi</h2>
  <p class="text-muted">Ringkasan pendapatan dan aktivitas penyewaan bus</p>
</div>

<div class="row">
  <div class="col-md-6 mb-3">
    <div class="card text-center" style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white;">
      <div class="card-body">
        <i class="fas fa-calendar-check" style="font-size: 3rem; margin-bottom: 1rem;"></i>
        <h5>Total Booking</h5>
        <p style="font-size: 3rem; font-weight: bold; margin: 1rem 0;">{{ $totalBookings }}</p>
        <p class="text-muted">Transaksi booking total</p>
      </div>
    </div>
  </div>
  <div class="col-md-6 mb-3">
    <div class="card text-center" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white;">
      <div class="card-body">
        <i class="fas fa-money-bill-wave" style="font-size: 3rem; margin-bottom: 1rem;"></i>
        <h5>Total Pendapatan</h5>
        <p style="font-size: 2.5rem; font-weight: bold; margin: 1rem 0;">Rp {{ number_format($totalRevenue, 0, ',', '.') }}</p>
        <p class="text-muted">Pendapatan kotor dari semua booking</p>
      </div>
    </div>
  </div>
</div>

<div class="card mt-4">
  <div class="card-header" style="background: linear-gradient(90deg, #2c3e50 0%, #34495e 100%); color: white;">
    <h5 class="mb-0"><i class="fas fa-chart-bar"></i> Statistik Laporan</h5>
  </div>
  <div class="card-body">
    <div class="row">
      <div class="col-md-4">
        <div class="text-center p-3">
          <p class="text-muted mb-1">Total Booking</p>
          <h3 style="color: #667eea;">{{ $totalBookings }}</h3>
        </div>
      </div>
      <div class="col-md-4">
        <div class="text-center p-3">
          <p class="text-muted mb-1">Rata-rata Pendapatan per Booking</p>
          <h3 style="color: #11998e;">Rp {{ $totalBookings > 0 ? number_format($totalRevenue / $totalBookings, 0, ',', '.') : 0 }}</h3>
        </div>
      </div>
      <div class="col-md-4">
        <div class="text-center p-3">
          <p class="text-muted mb-1">Total Pendapatan</p>
          <h3 style="color: #4facfe;">Rp {{ number_format($totalRevenue, 0, ',', '.') }}</h3>
        </div>
      </div>
    </div>
  </div>
</div>

<div class="mt-4">
  <a href="{{ route('admin.dashboard') }}" class="btn btn-secondary btn-lg">
    <i class="fas fa-arrow-left"></i> Kembali ke Dashboard
  </a>
  <button onclick="window.print()" class="btn btn-info btn-lg">
    <i class="fas fa-print"></i> Cetak Laporan
  </button>
</div>

@endsection
