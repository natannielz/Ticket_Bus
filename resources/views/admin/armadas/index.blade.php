@extends('layouts.app')

@section('content')
<div class="d-flex justify-content-between align-items-center mb-4">
  <div>
    <h2><i class="fas fa-bus"></i> Kelola Armada</h2>
    <p class="text-muted">Daftar semua bus armada perusahaan Anda</p>
  </div>
  <a href="{{ route('admin.armadas.create') }}" class="btn btn-success btn-lg">
    <i class="fas fa-plus"></i> Tambah Armada
  </a>
</div>

<div class="card">
  <div class="card-header" style="background: linear-gradient(90deg, #2c3e50 0%, #34495e 100%); color: white;">
    <h5 class="mb-0"><i class="fas fa-list"></i> Data Armada</h5>
  </div>
  <div class="card-body">
    @if($armadas->count() > 0)
      <div class="table-responsive">
        <table class="table table-hover">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nama Bus</th>
              <th>Kapasitas</th>
              <th>Harga/km</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            @foreach($armadas as $a)
              <tr>
                <td><strong>#{{ $a->id }}</strong></td>
                <td>
                  <i class="fas fa-bus" style="color: #667eea; margin-right: 0.5rem;"></i>
                  <strong>{{ $a->name }}</strong>
                </td>
                <td><span class="badge bg-info">{{ $a->capacity }} kursi</span></td>
                <td><strong>Rp {{ number_format($a->price_per_km, 0, ',', '.') }}</strong></td>
                <td>
                  @if($a->status == 'available')
                    <span class="badge bg-success">Tersedia</span>
                  @else
                    <span class="badge bg-warning">Maintenance</span>
                  @endif
                </td>
                <td>
                  <a href="{{ route('admin.armadas.edit', $a) }}" class="btn btn-sm btn-primary" title="Edit">
                    <i class="fas fa-edit"></i>
                  </a>
                  <form action="{{ route('admin.armadas.destroy', $a) }}" method="POST" style="display:inline">
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
        <i class="fas fa-info-circle"></i> Belum ada armada. <a href="{{ route('admin.armadas.create') }}" class="alert-link">Tambahkan armada baru sekarang!</a>
      </div>
    @endif
  </div>
</div>

@endsection
