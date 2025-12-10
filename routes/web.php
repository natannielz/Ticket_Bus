<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "web" middleware group. Make something great!
|
*/

use App\Http\Controllers\AuthController;
use App\Http\Controllers\BookingController;
use App\Http\Controllers\Admin\ArmadaController;
use App\Http\Controllers\Admin\TransactionController;
use App\Http\Controllers\Admin\BookingController as AdminBookingController;

use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome');
})->name('home');

Route::get('/catalog', function () {
    // Mock data for catalog, later fetch from DB
    return Inertia::render('Catalog', [
        'events' => [
            [
                'id' => 1,
                'title' => 'VIP Concert Pass',
                'price' => 750000,
                'date' => '2025-12-25',
                'image' => 'https://images.unsplash.com/photo-1459749411177-287ce35e8b0f?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
            ],
            [
                'id' => 2,
                'title' => 'Executive Bus Trip',
                'price' => 500000,
                'date' => '2025-12-30',
                'image' => 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?ixlib=rb-1.2.1&auto=format&fit=crop&w=1351&q=80',
            ],
            [
                'id' => 3,
                'title' => 'City Tour Special',
                'price' => 250000,
                'date' => '2026-01-01',
                'image' => 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?ixlib=rb-1.2.1&auto=format&fit=crop&w=1949&q=80',
            ],
        ]
    ]);
})->name('catalog.index');

// Auth
Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
Route::post('/login', [AuthController::class, 'login'])->name('login.post');
Route::get('/register', [AuthController::class, 'showRegister'])->name('register');
Route::post('/register', [AuthController::class, 'register'])->name('register.post');
Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

Route::middleware('auth')->group(function () {
    // user bookings
    Route::get('/bookings', [BookingController::class, 'index'])->name('bookings.index');
    Route::get('/bookings/create', [BookingController::class, 'create'])->name('bookings.create');
    Route::post('/bookings', [BookingController::class, 'store'])->name('bookings.store');

    // admin routes
    Route::middleware('admin')->prefix('admin')->name('admin.')->group(function () {
        Route::get('/dashboard', [TransactionController::class, 'index'])->name('dashboard');
        Route::get('/report', [TransactionController::class, 'report'])->name('report');

        Route::get('/armadas', [ArmadaController::class, 'index'])->name('armadas.index');
        Route::get('/armadas/create', [ArmadaController::class, 'create'])->name('armadas.create');
        Route::post('/armadas', [ArmadaController::class, 'store'])->name('armadas.store');
        Route::get('/armadas/{armada}/edit', [ArmadaController::class, 'edit'])->name('armadas.edit');
        Route::put('/armadas/{armada}', [ArmadaController::class, 'update'])->name('armadas.update');
        Route::delete('/armadas/{armada}', [ArmadaController::class, 'destroy'])->name('armadas.destroy');



        Route::get('/bookings', [AdminBookingController::class, 'index'])->name('bookings.index');
        Route::get('/bookings/{booking}', [AdminBookingController::class, 'show'])->name('bookings.show');
        Route::get('/bookings/{booking}/invoice', [AdminBookingController::class, 'invoice'])->name('bookings.invoice');
        Route::post('/bookings/{booking}/send-receipt', [AdminBookingController::class, 'sendReceipt'])->name('bookings.sendReceipt');
        Route::post('/bookings/{booking}/status', [AdminBookingController::class, 'updateStatus'])->name('bookings.updateStatus');
        Route::delete('/bookings/{booking}', [AdminBookingController::class, 'destroy'])->name('bookings.destroy');
    });
});

