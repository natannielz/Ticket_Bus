<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AdminMiddleware
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next)
    {
        $user = Auth::user();
        if (! $user || $user->role !== 'admin') {
            return redirect()->route('login')->with('error', 'You must be admin to access that page');
        }

        return $next($request);
    }
}
