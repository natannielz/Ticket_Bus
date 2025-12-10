<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;

class BookingController extends Controller
{
    public function index()
    {
        $bookings = Booking::with('user', 'armada')->latest()->get();
        return view('admin.bookings.index', compact('bookings'));
    }

    public function show(Booking $booking)
    {
        $booking->load('user', 'armada');
        return view('admin.bookings.show', compact('booking'));
    }

    public function updateStatus(Request $request, Booking $booking)
    {
        $data = $request->validate([
            'status' => 'required|in:pending,confirmed,completed,cancelled',
        ]);

        $booking->update($data);
        return redirect()->route('admin.bookings.index')->with('success', 'Status booking berhasil diperbarui');
    }

    public function destroy(Booking $booking)
    {
        $booking->delete();
        return redirect()->route('admin.bookings.index')->with('success', 'Booking berhasil dihapus');
    }

    public function invoice(Booking $booking)
    {
        $booking->load('user', 'armada');

        $pdf = Pdf::loadView('invoices.invoice', compact('booking'))->setPaper('a4', 'portrait');

        return $pdf->stream('invoice-' . $booking->id . '.pdf');
    }

    public function sendReceipt(Booking $booking)
    {
        $booking->load('user', 'armada');

        $pdf = Pdf::loadView('invoices.invoice', compact('booking'))->setPaper('a4', 'portrait');

        // Mock email sending for now as configuring mailer is out of scope/complex without creds
        // But implementation code:
        /*
        \Mail::send([], [], function($message) use ($booking, $pdf) {
            $message->to($booking->user->email)
                    ->subject('Receipt for Booking #' . $booking->id)
                    ->attachData($pdf->output(), "invoice-{$booking->id}.pdf");
        });
        */

        // For demonstration purposes, we'll just redirect with success
        return back()->with('success', 'Receipt sent to customer email (Mocked)');
    }
}
