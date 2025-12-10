<?php

namespace App\Http\Controllers;

use App\Models\Armada;
use Inertia\Inertia;

class CatalogController extends Controller
{
  public function index()
  {
    $events = Armada::where('status', 'available')->get()->map(function ($armada) {
      return [
        'id' => $armada->id,
        'title' => $armada->name,
        'level' => $armada->level,
        'date' => ucfirst($armada->status),
        'route' => $armada->route,
        'price' => $armada->price_per_km,
        'image' => $armada->image,
        'amenities' => $armada->amenities,
        'seat_config' => $armada->seat_config,
        'history' => $armada->history,
        'capacity' => $armada->capacity,
      ];
    });

    return Inertia::render('Catalog', [
      'events' => $events
    ]);
  }
}
