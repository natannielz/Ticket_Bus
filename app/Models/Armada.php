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
        'level',
        'route',
        'amenities',
        'seat_config',
        'history',
        'image_path',
    ];

    protected $appends = ['image'];

    public function getImageAttribute()
    {
        return $this->image_path ? '/images/armadas/' . $this->image_path : 'https://placehold.co/600x400';
    }
}
