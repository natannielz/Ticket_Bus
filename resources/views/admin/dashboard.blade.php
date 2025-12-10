@extends('layouts.app')

@section('content')
<div class="min-h-screen bg-gray-100 py-6">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Dashboard Header -->
        <div class="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div class="flex items-center">
                <div class="p-3 bg-indigo-600 rounded-xl shadow-lg">
                    <i class="fas fa-tachometer-alt text-white text-2xl"></i>
                </div>
                <div class="ml-4">
                    <h1 class="text-3xl font-bold text-gray-900 tracking-tight">Admin Dashboard</h1>
                    <p class="text-sm text-gray-500 mt-1">Manage bookings and fleet status</p>
                </div>
            </div>
            @if($pendingBookings > 0)
                 <a href="{{ route('admin.bookings.index') }}" class="mt-4 sm:mt-0 flex items-center px-4 py-2 bg-amber-500 text-white rounded-lg shadow-md hover:bg-amber-600 transition duration-300 transform hover:scale-105">
                    <span class="flex h-3 w-3 relative mr-2">
                        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-200 opacity-75"></span>
                        <span class="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                    </span>
                    <span class="font-medium">{{ $pendingBookings }} Pending Bookings</span>
                 </a>
            @endif
        </div>

        <!-- Stats Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <!-- Stat Card 1 -->
            <div class="bg-white rounded-xl shadow-sm hover:shadow-md transition duration-300 overflow-hidden border-l-4 border-indigo-500">
                <div class="p-6">
                    <div class="flex items-center justify-between mb-4">
                        <div class="text-gray-400 text-sm font-medium uppercase tracking-wider">Total Fleet</div>
                        <div class="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                            <i class="fas fa-bus text-lg"></i>
                        </div>
                    </div>
                    <div class="text-3xl font-bold text-gray-800">{{ $totalArmadas ?? 0 }}</div>
                </div>
            </div>

            <!-- Stat Card 2 -->
            <div class="bg-white rounded-xl shadow-sm hover:shadow-md transition duration-300 overflow-hidden border-l-4 border-emerald-500">
                <div class="p-6">
                    <div class="flex items-center justify-between mb-4">
                        <div class="text-gray-400 text-sm font-medium uppercase tracking-wider">Bookings</div>
                        <div class="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                            <i class="fas fa-calendar-check text-lg"></i>
                        </div>
                    </div>
                    <div class="text-3xl font-bold text-gray-800">{{ $totalBookings ?? 0 }}</div>
                </div>
            </div>

            <!-- Stat Card 3 -->
            <div class="bg-white rounded-xl shadow-sm hover:shadow-md transition duration-300 overflow-hidden border-l-4 border-rose-500">
                <div class="p-6">
                    <div class="flex items-center justify-between mb-4">
                        <div class="text-gray-400 text-sm font-medium uppercase tracking-wider">Users</div>
                        <div class="p-2 bg-rose-50 rounded-lg text-rose-600">
                            <i class="fas fa-users text-lg"></i>
                        </div>
                    </div>
                    <div class="text-3xl font-bold text-gray-800">{{ $totalUsers ?? 0 }}</div>
                </div>
            </div>

             <!-- Stat Card 4 -->
             <div class="bg-white rounded-xl shadow-sm hover:shadow-md transition duration-300 overflow-hidden border-l-4 border-cyan-500">
                <div class="p-6">
                    <div class="flex items-center justify-between mb-4">
                        <div class="text-gray-400 text-sm font-medium uppercase tracking-wider">Revenue</div>
                        <div class="p-2 bg-cyan-50 rounded-lg text-cyan-600">
                            <i class="fas fa-money-bill-wave text-lg"></i>
                        </div>
                    </div>
                    <div class="text-2xl font-bold text-gray-800">Rp {{ number_format($totalRevenue ?? 0, 0, ',', '.') }}</div>
                </div>
            </div>
        </div>

        <!-- Quick Actions -->
        <h3 class="text-lg font-semibold text-gray-800 mb-4 px-1">Quick Actions</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 h-full">
            <a href="{{ route('admin.armadas.index') }}" class="group bg-white rounded-xl shadow-sm p-6 hover:shadow-md hover:bg-indigo-50 transition duration-300 flex flex-col justify-between h-32">
                <div class="flex items-center space-x-3 text-indigo-600 mb-2">
                    <i class="fas fa-plus-circle text-2xl group-hover:scale-110 transition-transform"></i>
                    <span class="font-bold text-lg">Fleet</span>
                </div>
                <p class="text-sm text-gray-500">Manage bus inventory</p>
            </a>
            
            <a href="#" class="group bg-white rounded-xl shadow-sm p-6 hover:shadow-md hover:bg-emerald-50 transition duration-300 flex flex-col justify-between h-32 opacity-50 cursor-not-allowed" title="Route management disabled">
                 <div class="flex items-center space-x-3 text-emerald-600 mb-2">
                    <i class="fas fa-route text-2xl"></i>
                    <span class="font-bold text-lg">Route</span>
                </div>
                <p class="text-sm text-gray-500">Single event mode</p>
            </a>

            <a href="{{ route('admin.bookings.index') }}" class="group bg-white rounded-xl shadow-sm p-6 hover:shadow-md hover:bg-violet-50 transition duration-300 flex flex-col justify-between h-32">
                <div class="flex items-center space-x-3 text-violet-600 mb-2">
                    <i class="fas fa-calendar-check text-2xl group-hover:scale-110 transition-transform"></i>
                    <span class="font-bold text-lg">Bookings</span>
                </div>
                <p class="text-sm text-gray-500">Manage orders</p>
            </a>

            <a href="{{ route('admin.report') }}" class="group bg-white rounded-xl shadow-sm p-6 hover:shadow-md hover:bg-rose-50 transition duration-300 flex flex-col justify-between h-32">
                <div class="flex items-center space-x-3 text-rose-600 mb-2">
                    <i class="fas fa-file-alt text-2xl group-hover:scale-110 transition-transform"></i>
                    <span class="font-bold text-lg">Report</span>
                </div>
                <p class="text-sm text-gray-500">View transactions</p>
            </a>
        </div>

        <!-- Recent Transactions Table -->
        <div class="bg-white rounded-xl shadow-lg overflow-hidden">
            <div class="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                <h3 class="text-lg font-bold text-gray-800"><i class="fas fa-history mr-2 text-indigo-500"></i> Recent Transactions</h3>
                <span class="text-xs font-semibold px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full">Live Updates</span>
            </div>
            <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr class="bg-gray-50 text-gray-600 uppercase text-xs tracking-wider">
                            <th class="px-6 py-4 font-semibold border-b">ID</th>
                            <th class="px-6 py-4 font-semibold border-b">User</th>
                            <th class="px-6 py-4 font-semibold border-b">Bus</th>
                            <th class="px-6 py-4 font-semibold border-b">Date</th>
                            <th class="px-6 py-4 font-semibold border-b">Total</th>
                            <th class="px-6 py-4 font-semibold border-b">Status</th>
                            <th class="px-6 py-4 font-semibold border-b text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100" id="bookings-table-body">
                        @foreach($bookings as $booking)
                        <tr class="hover:bg-gray-50 transition duration-150">
                            <td class="px-6 py-4 text-sm font-medium text-gray-900">#{{ $booking->id }}</td>
                            <td class="px-6 py-4 text-sm text-gray-600">{{ $booking->user->name ?? '-' }}</td>
                            <td class="px-6 py-4 text-sm text-gray-600">{{ $booking->armada->name ?? '-' }}</td>
                            <td class="px-6 py-4 text-sm text-gray-600">{{ \Carbon\Carbon::parse($booking->date)->format('d M Y') }}</td>
                            <td class="px-6 py-4 text-sm font-bold text-gray-800">Rp {{ number_format($booking->total_price, 0, ',', '.') }}</td>
                            <td class="px-6 py-4 text-sm">
                                @if($booking->status == 'pending')
                                    <span class="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200">
                                        Pending
                                    </span>
                                @elseif($booking->status == 'confirmed')
                                    <span class="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 border border-green-200">
                                        Confirmed
                                    </span>
                                @elseif($booking->status == 'completed')
                                    <span class="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                                        Completed
                                    </span>
                                @else
                                    <span class="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800 border border-red-200">
                                        {{ ucfirst($booking->status) }}
                                    </span>
                                @endif
                            </td>
                            <td class="px-6 py-4 text-sm text-right">
                                <form action="{{ route('admin.bookings.sendReceipt', $booking->id) }}" method="POST" class="inline-block">
                                    @csrf
                                    <button type="submit" class="text-indigo-600 hover:text-indigo-900 font-medium hover:underline text-xs uppercase tracking-wide bg-transparent border-0 cursor-pointer">
                                        <i class="fas fa-paper-plane mr-1"></i> Send Receipt
                                    </button>
                                </form>
                            </td>
                        </tr>
                        @endforeach
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</div>

<!-- Notification Toast -->
<div id="toast-notification" class="fixed top-5 right-5 z-50 transform translate-x-full transition-transform duration-300 ease-in-out">
  <div class="bg-white border-l-4 border-indigo-600 rounded-lg shadow-2xl p-4 flex items-start w-80">
    <div class="flex-shrink-0">
      <div class="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
        <i class="fas fa-bell text-indigo-600 animate-pulse"></i>
      </div>
    </div>
    <div class="ml-3 flex-1">
      <p class="text-sm font-bold text-gray-900">New Order Recieved!</p>
      <p class="text-sm text-gray-600 mt-1" id="toast-message">Customer placed a new booking.</p>
    </div>
    <button onclick="closeToast()" class="ml-2 text-gray-400 hover:text-gray-500 focus:outline-none">
      <i class="fas fa-times"></i>
    </button>
  </div>
</div>

@endsection

@section('scripts')
<script type="module">
    console.log("Dashboard loaded. Waiting for events...");
    
    // Function to show toast
    window.showToast = function(message) {
        const toast = document.getElementById('toast-notification');
        const msgEl = document.getElementById('toast-message');
        if(toast && msgEl) {
            msgEl.innerText = message;
            toast.classList.remove('translate-x-full');
            
            // Audio sound (optional, browser policy may block)
            // const audio = new Audio('/notification.mp3');
            // audio.play().catch(e => console.log('Audio blocked'));

            setTimeout(() => {
                closeToast();
            }, 5000);
        }
    }

    window.closeToast = function() {
       const toast = document.getElementById('toast-notification');
       if(toast) toast.classList.add('translate-x-full');
    }

    // Listener
    // Note: Assuming 'admin-channel' is the channel name in NewOrderReceived
    Echo.channel('admin-channel')
        .listen('NewOrderReceived', (e) => {
            console.log('Order received:', e);
            showToast(`New booking from ID: ${e.booking.user_id} (Amount: ${e.booking.total_price})`);
            
            // Optionally prepend to table (DOM manipulation)
            // This is basic for now
        });
</script>
@endsection