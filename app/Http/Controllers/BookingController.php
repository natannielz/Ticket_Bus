<?php

namespace App\Http\Controllers;

use App\Models\Armada;
use App\Models\Booking;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class BookingController extends Controller
{
    public function index()
    {
        $bookings = Booking::where('user_id', Auth::id())->with('armada')->get();
        return view('bookings.index', compact('bookings'));
    }

    public function create()
    {
        $armadas = Armada::where('status', 'available')->get();
        return view('bookings.create', compact('armadas'));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'armada_id' => 'required|exists:armadas,id',
            'date' => 'required|date',
            'seats' => 'required|integer|min:1',
        ]);

        $armada = Armada::findOrFail($data['armada_id']);

        // Check availability (optional refinement)
        if ($data['seats'] > $armada->capacity) {
            return back()->with('error', 'Not enough seats available.');
        }

        // Calculate total: seats * armada price per seat
        $total = $data['seats'] * $armada->price_per_km;

        $booking = Booking::create([
            'user_id' => Auth::id(),
            'armada_id' => $armada->id,
            'date' => $data['date'],
            'seats' => $data['seats'],
            'total_price' => $total,
            'status' => 'pending',
        ]);

        // Trigger event
        \App\Events\NewOrderReceived::dispatch($booking);

        return redirect()->route('home')->with('success', 'Booking Successful!');
    }
}

