@extends('layouts.app')

@section('content')
<div class="mb-4">
  <div>
    <h2><i class="fas fa-calendar-check"></i> Kelola Booking</h2>
    <p class="text-muted">Lihat dan terima booking dari pengguna</p>
  </div>
</div>

<div class="card">
  <div class="card-header" style="background: linear-gradient(90deg, #2c3e50 0%, #34495e 100%); color: white;">
    <h5 class="mb-0"><i class="fas fa-list"></i> Daftar Semua Booking</h5>
  </div>
  <div class="card-body">
    @if($bookings->count() > 0)
      <div class="table-responsive">
        <table class="table table-hover">
          <thead>
            <tr>
              <th>ID</th>
              <th>Pengguna</th>
              <th>Rute</th>
              <th>Bus</th>
              <th>Tanggal</th>
              <th>Kursi</th>
              <th>Total Harga</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            @foreach($bookings as $booking)
              <tr>
                <td><strong>#{{ $booking->id }}</strong></td>
                <td>
                  <i class="fas fa-user" style="color: #667eea; margin-right: 0.5rem;"></i>
                  {{ $booking->user->name ?? '-' }}
                </td>
                <td>
                  <i class="fas fa-route" style="color: #11998e; margin-right: 0.5rem;"></i>
                  {{ $booking->route->name ?? '-' }}
                </td>
                <td>
                  <i class="fas fa-bus" style="color: #764ba2; margin-right: 0.5rem;"></i>
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
                <td>
                  @if($booking->status == 'pending')
                    <form action="{{ route('admin.bookings.updateStatus', $booking) }}" method="POST" style="display:inline">
                      @csrf
                      <input type="hidden" name="status" value="confirmed">
                      <button class="btn btn-sm btn-success" title="Terima">
                        <i class="fas fa-check"></i>
                      </button>
                    </form>
                  @endif
                  <a href="{{ route('admin.bookings.show', $booking) }}" class="btn btn-sm btn-info" title="Detail">
                    <i class="fas fa-eye"></i>
                  </a>
                  <form action="{{ route('admin.bookings.destroy', $booking) }}" method="POST" style="display:inline">
                    @csrf @method('DELETE')
                    <button class="btn btn-sm btn-danger" onclick="return confirm('Yakin ingin menghapus?')" title="Hapus">
                      <i class="fas fa-trash"></i>
                    </button>
                  </form>
                </td>
              </tr>
            @endforeach
          </tbody>
        </table>
      </div>
    @else
      <div class="alert alert-info text-center">
        <i class="fas fa-info-circle"></i> Belum ada booking dari pengguna.
      </div>
    @endif
  </div>
</div>

@endsection
