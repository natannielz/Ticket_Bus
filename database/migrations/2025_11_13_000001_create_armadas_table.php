<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('armadas', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->integer('capacity')->default(0);
            $table->decimal('price_per_km', 10, 2)->default(0);
            $table->string('status')->default('available');
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('armadas');
    }
};
