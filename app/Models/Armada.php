<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Armada extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'capacity',
        'price_per_km',
        'status',
    ];
}
