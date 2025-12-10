<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use Illuminate\Support\Facades\Auth;

class HomeController extends Controller
{
    public function index()
    {
        if (!Auth::check()) {
            return view('welcome');
        }

        if (Auth::user()->isAdmin()) {
            return redirect()->route('admin.dashboard');
        }

        $userId = Auth::id();
        $totalBookings = Booking::where('user_id', $userId)->count();
        $pendingBookings = Booking::where('user_id', $userId)->where('status', 'pending')->count();
        $completedBookings = Booking::where('user_id', $userId)->where('status', 'completed')->count();
        $totalSpent = Booking::where('user_id', $userId)->sum('total_price');
        $recentBookings = Booking::where('user_id', $userId)->with('armada')->orderBy('created_at', 'desc')->take(5)->get();

        return view('user.dashboard', compact('totalBookings', 'pendingBookings', 'completedBookings', 'totalSpent', 'recentBookings'));
    }
}
