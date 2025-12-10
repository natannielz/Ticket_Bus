@extends('layouts.app')

@section('content')
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-xl w-full space-y-8">
      <div class="bg-white rounded-2xl shadow-xl overflow-hidden transform transition-all hover:shadow-2xl duration-300">
        <!-- Header -->
        <div class="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6">
          <div class="flex items-center justify-between">
            <h2 class="text-2xl font-bold text-white tracking-wide">
              <i class="fas fa-ticket-alt mr-2"></i> Book Your Ticket
            </h2>
            <span
              class="bg-white bg-opacity-20 rounded-full px-3 py-1 text-xs text-white font-medium uppercase tracking-wider">New</span>
          </div>
          <p class="mt-2 text-indigo-100 text-sm">Secure your seat for the upcoming event.</p>
        </div>

        <!-- Form -->
        <div class="px-8 py-8">
          @if($armadas->count() > 0)
            <form method="POST" action="{{ route('bookings.store') }}" class="space-y-6">
              @csrf

              <!-- Bus Selection -->
              <div>
                <label for="armada_id" class="block text-sm font-medium text-gray-700 mb-2">Select Bus Class</label>
                <div class="relative">
                  <select name="armada_id" id="armada_id"
                    class="block w-full pl-3 pr-10 py-3 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-lg shadow-sm bg-gray-50 transition duration-150 ease-in-out"
                    required>
                    <option value="">-- Choose a Bus --</option>
                    @foreach($armadas as $a)
                      <option value="{{ $a->id }}">
                        {{ $a->name }} - Rp {{ number_format($a->price_per_km, 0, ',', '.') }}/seat ({{ $a->capacity }} seats)
                      </option>
                    @endforeach
                  </select>
                  <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                    <i class="fas fa-chevron-down text-xs"></i>
                  </div>
                </div>
                @error('armada_id')
                  <p class="mt-2 text-sm text-red-600"><i class="fas fa-exclamation-circle mr-1"></i> {{ $message }}</p>
                @enderror
              </div>

              <!-- Date -->
              <div>
                <label for="date" class="block text-sm font-medium text-gray-700 mb-2">Travel Date</label>
                <div class="relative rounded-md shadow-sm">
                  <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <i class="fas fa-calendar text-gray-400"></i>
                  </div>
                  <input type="date" name="date" id="date"
                    class="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-lg py-3 bg-gray-50"
                    required>
                </div>
                @error('date')
                  <p class="mt-2 text-sm text-red-600">{{ $message }}</p>
                @enderror
              </div>

              <!-- Seats -->
              <div>
                <label for="seats" class="block text-sm font-medium text-gray-700 mb-2">Number of Seats</label>
                <div class="relative rounded-md shadow-sm">
                  <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <i class="fas fa-users text-gray-400"></i>
                  </div>
                  <input type="number" name="seats" id="seats" min="1" max="50" value="1"
                    class="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-lg py-3 bg-gray-50"
                    required>
                </div>
                @error('seats')
                  <p class="mt-2 text-sm text-red-600">{{ $message }}</p>
                @enderror
              </div>

              <!-- Submit Button -->
              <div class="pt-4">
                <button type="submit"
                  class="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
                  <span class="absolute left-0 inset-y-0 flex items-center pl-3">
                    <i class="fas fa-check group-hover:text-indigo-200"></i>
                  </span>
                  Confirm Booking
                </button>
              </div>

              <div class="text-center mt-4">
                <a href="/" class="text-sm text-indigo-600 hover:text-indigo-500 font-medium transition duration-150">
                  <i class="fas fa-arrow-left mr-1"></i> Back to Home
                </a>
              </div>
            </form>
          @else
            <div class="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md">
              <div class="flex">
                <div class="flex-shrink-0">
                  <i class="fas fa-exclamation-triangle text-yellow-400"></i>
                </div>
                <div class="ml-3">
                  <p class="text-sm text-yellow-700">
                    No busses available at the moment. Please check back later.
                  </p>
                </div>
              </div>
            </div>
          @endif
        </div>
      </div>
    </div>
  </div>
@endsection