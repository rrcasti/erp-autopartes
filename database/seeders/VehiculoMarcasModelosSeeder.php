<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\VehiculoMarca;
use App\Models\VehiculoModelo;

class VehiculoMarcasModelosSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $marcasConModelos = [
            'Renault' => [
                'Clio', 'Megane', 'Sandero', 'Logan', 'Duster', 'Kangoo', 'Twingo', 
                'Fluence', 'Captur', 'Koleos', 'Oroch', 'Scenic'
            ],
            'Chevrolet' => [
                'Corsa', 'Onix', 'Cruze', 'Spin', 'Prisma', 'Tracker', 'Trailblazer',
                'S10', 'Montana', 'Agile', 'Classic', 'Aveo', 'Captiva', 'Sonic'
            ],
            'Volkswagen' => [
                'Gol', 'Polo', 'Voyage', 'Fox', 'Suran', 'Saveiro', 'Amarok',
                'T-Cross', 'Tiguan', 'Vento', 'Golf', 'Passat', 'Up'
            ],
            'Fiat' => [
                'Palio', 'Uno', 'Argo', 'Cronos', 'Toro', 'Strada', 'Siena',
                'Punto', 'Mobi', 'Fiorino', 'Ducato', '500'
            ],
            'Ford' => [
                'Fiesta', 'Focus', 'Ka', 'EcoSport', 'Ranger', 'Mondeo',
                'Kuga', 'Territory', 'F-100', 'Falcon'
            ],
            'Peugeot' => [
                '208', '308', '408', '2008', '3008', '5008', 'Partner',
                '207', '307', '407', '206', '306'
            ],
            'Toyota' => [
                'Corolla', 'Hilux', 'Etios', 'SW4', 'Yaris', 'RAV4',
                'Camry', 'Land Cruiser', 'Prius'
            ],
            'Honda' => [
                'Civic', 'City', 'HR-V', 'CR-V', 'Fit', 'Accord', 'WR-V'
            ],
            'Nissan' => [
                'Versa', 'Kicks', 'Frontier', 'Sentra', 'X-Trail', 'March',
                'Tiida', 'Pathfinder', 'Altima'
            ],
            'Citroën' => [
                'C3', 'C4', 'C5', 'Berlingo', 'Jumper', 'C-Elysée',
                'C4 Cactus', 'C4 Lounge', 'Aircross'
            ],
        ];

        foreach ($marcasConModelos as $marcaNombre => $modelos) {
            // Crear o encontrar la marca
            $marca = VehiculoMarca::firstOrCreate(
                ['nombre' => $marcaNombre],
                ['activo' => true]
            );

            // Crear modelos para esta marca
            foreach ($modelos as $modeloNombre) {
                VehiculoModelo::firstOrCreate(
                    [
                        'vehiculo_marca_id' => $marca->id,
                        'nombre' => $modeloNombre,
                    ],
                    ['activo' => true]
                );
            }
        }

        $this->command->info('✅ Marcas y modelos de vehículos cargados exitosamente.');
    }
}
