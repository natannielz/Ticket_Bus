@extends('layouts.app')

@section('content')
<div class="row justify-content-center">
  <div class="col-md-6">
    <div class="card" style="border-top: 4px solid #667eea;">
      <div class="card-header" style="background: linear-gradient(90deg, #2c3e50 0%, #34495e 100%); color: white;">
        <h5 class="mb-0"><i class="fas fa-plus-circle"></i> Tambah Rute Baru</h5>
      </div>
      <div class="card-body">
        <form method="POST" action="{{ route('admin.routes.store') }}">
          @csrf
          <div class="mb-3">
            <label class="form-label"><i class="fas fa-route"></i> Nama Rute</label>
            <input name="name" class="form-control form-control-lg" placeholder="Contoh: Jakarta - Bandung" required>
            @error('name')<span class="text-danger small">{{ $message }}</span>@enderror
          </div>
          <!-- <div>
            <div id="map">
  
            </div>
            <div id="info">Klik di peta untuk menambahkan posisi.</div>
            <div id="controls">
                <button onclick="resetMap()">Reset Map</button>
            </div>
          </div> -->
          <h3>Klik di peta untuk menambahkan beberapa posisi dan hitung jarak total</h3>
          <div id="map"></div>
          <div id="info">Klik di peta untuk menambahkan posisi.</div>
          <div id="controls">
              <button onclick="resetMap()">Reset Map</button>
          </div>

          <div class="mb-3">
            <label class="form-label"><i class="fas fa-file-alt"></i> Deskripsi</label>
            <textarea name="description" class="form-control form-control-lg" rows="3" placeholder="Contoh: Rute perjalanan dari Jakarta ke Bandung via Puncak"></textarea>
            @error('description')<span class="text-danger small">{{ $message }}</span>@enderror
          </div>
          <div class="mb-3">
            <label class="form-label"><i class="fas fa-road"></i> Jarak (km)</label>
            <input type="number" name="distance" class="form-control form-control-lg" placeholder="Contoh: 120" min="1" step="0.01"  required>
            @error('distance')<span class="text-danger small">{{ $message }}</span>@enderror
          </div>
          <div class="mb-3">
            <label class="form-label"><i class="fas fa-toggle-on"></i> Status</label>
            <select name="status" class="form-control form-control-lg">
              <option value="active">Aktif</option>
              <option value="inactive">Nonaktif</option>
            </select>
            @error('status')<span class="text-danger small">{{ $message }}</span>@enderror
          </div>
          <button class="btn btn-primary btn-lg w-100">
            <i class="fas fa-save"></i> Simpan Rute
          </button>
          <a href="{{ route('admin.routes.index') }}" class="btn btn-secondary btn-lg w-100 mt-2">
            <i class="fas fa-arrow-left"></i> Kembali
          </a>
        </form>
      </div>
    </div>
  </div>
</div>

<script src="https://maps.googleapis.com/maps/api/js?key=AIzaSyAOVYRIgupAurZup5y1PRh8Ismb1A3lLao&callback=initMap" async defer></script>
<script>
  let map;
  let markers = [];
  let lines = [];
  let totalDistance = 0;

  function initMap() {
      const defaultLocation = {lat: -6.200000, lng: 106.816666};
      map = new google.maps.Map(document.getElementById('map'), {
          zoom: 5,
          center: defaultLocation
      });

      map.addListener('click', function(event) {
          const pos = event.latLng;
          const marker = new google.maps.Marker({
              position: pos,
              map: map,
              label: (markers.length + 1).toString()
          });
          markers.push(marker);

          if (markers.length > 1) {
              const prevPos = markers[markers.length - 2].getPosition();
              // Gambar garis antar marker
              const line = new google.maps.Polyline({
                  path: [prevPos, pos],
                  geodesic: true,
                  strokeColor: "#FF0000",
                  strokeOpacity: 1.0,
                  strokeWeight: 2,
                  map: map
              });
              lines.push(line);

              // Hitung jarak dan tambahkan ke total
              const distance = haversineDistance(prevPos.lat(), prevPos.lng(), pos.lat(), pos.lng());
              totalDistance += distance;
          }

          document.getElementById('info').innerHTML = `Jumlah posisi: ${markers.length} | Total jarak: ${totalDistance.toFixed(2)} km`;
          document.querySelector('input[name="distance"]').value = totalDistance.toFixed(2);
      });
  }

  // Haversine formula
  function haversineDistance(lat1, lon1, lat2, lon2) {
      const R = 6371; // km
      const dLat = deg2rad(lat2 - lat1);
      const dLon = deg2rad(lon2 - lon1);
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c;
  }

  function deg2rad(deg) {
      return deg * (Math.PI/180);
  }

  // Fungsi reset map
  function resetMap() {
      markers.forEach(m => m.setMap(null));
      markers = [];
      lines.forEach(l => l.setMap(null));
      lines = [];
      totalDistance = 0;
      document.getElementById('info').innerHTML = "Klik di peta untuk menambahkan posisi.";
      document.querySelector('input[name="distance"]').value = '';
  }
</script>