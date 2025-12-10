<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
  public function up()
  {
    Schema::table('armadas', function (Blueprint $table) {
      $table->string('level')->nullable();
      $table->string('route')->nullable();
      $table->text('amenities')->nullable();
      $table->string('seat_config')->nullable();
      $table->text('history')->nullable();
      $table->string('image_path')->nullable();
    });
  }

  public function down()
  {
    Schema::table('armadas', function (Blueprint $table) {
      $table->dropColumn(['level', 'route', 'amenities', 'seat_config', 'history', 'image_path']);
    });
  }
};
