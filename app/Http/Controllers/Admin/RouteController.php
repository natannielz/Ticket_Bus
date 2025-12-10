<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Route;
use Illuminate\Http\Request;

class RouteController extends Controller
{
    public function index()
    {
        $routes = Route::all();
        return view('admin.routes.index', compact('routes'));
    }

    public function create()
    {
        return view('admin.routes.create');
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|unique:routes',
            'description' => 'nullable|string',
            'distance' => 'required|numeric|min:1',
            'status' => 'required|string',
        ]);

        Route::create($data);
        return redirect()->route('admin.routes.index')->with('success', 'Rute berhasil ditambahkan');
    }

    public function edit(Route $route)
    {
        return view('admin.routes.edit', compact('route'));
    }

    public function update(Request $request, Route $route)
    {
        $data = $request->validate([
            'name' => 'required|string|unique:routes,name,' . $route->id,
            'description' => 'nullable|string',
            'distance' => 'required|integer|min:1',
            'status' => 'required|string',
        ]);

        $route->update($data);
        return redirect()->route('admin.routes.index')->with('success', 'Rute berhasil diperbarui');
    }

    public function destroy(Route $route)
    {
        $route->delete();
        return redirect()->route('admin.routes.index')->with('success', 'Rute berhasil dihapus');
    }
}