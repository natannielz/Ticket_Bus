<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Armada;
use Illuminate\Http\Request;

class ArmadaController extends Controller
{
    public function index()
    {
        $armadas = Armada::all();
        return view('admin.armadas.index', compact('armadas'));
    }

    public function create()
    {
        return view('admin.armadas.create');
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string',
            'capacity' => 'required|integer|min:1',
            'price_per_km' => 'required|numeric',
            'status' => 'required|string',
        ]);

        Armada::create($data);
        return redirect()->route('admin.armadas.index')->with('success', 'Armada added');
    }

    public function edit(Armada $armada)
    {
        return view('admin.armadas.edit', compact('armada'));
    }

    public function update(Request $request, Armada $armada)
    {
        $data = $request->validate([
            'name' => 'required|string',
            'capacity' => 'required|integer|min:1',
            'price_per_km' => 'required|numeric',
            'status' => 'required|string',
        ]);

        $armada->update($data);
        return redirect()->route('admin.armadas.index')->with('success', 'Armada updated');
    }

    public function destroy(Armada $armada)
    {
        $armada->delete();
        return redirect()->route('admin.armadas.index')->with('success', 'Armada deleted');
    }
}
