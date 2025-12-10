<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Armada;
use App\Models\User;
use Illuminate\Http\Request;

class TransactionController extends Controller
{
    public function index()
    {
        $bookings = Booking::with('user', 'armada')->orderBy('created_at', 'desc')->get();
        $totalArmadas = Armada::count();
        $totalBookings = Booking::count();
        $totalUsers = User::where('role', 'user')->count();
        $totalRevenue = Booking::sum('total_price');
        $pendingBookings = Booking::where('status', 'pending')->count();

        return \Inertia\Inertia::render('Admin/Dashboard', compact('bookings', 'totalArmadas', 'totalBookings', 'totalUsers', 'totalRevenue', 'pendingBookings'));
    }

    public function report(Request $request)
    {
        // simple report: total bookings and total revenue
        $totalBookings = Booking::count();
        $totalRevenue = Booking::sum('total_price');

        return view('admin.report', compact('totalBookings', 'totalRevenue'));
    }
}

