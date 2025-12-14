<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use App\Models\User;

class RolesAndPermissionsSeeder extends Seeder
{
    public function run()
    {
        // Reset cached roles and permissions
        app(\Spatie\Permission\PermissionRegistrar::class)->forgetCachedPermissions();

        // 1. Define Permissions
        $permissions = [
            'view_dashboard',
            'view_products',
            'manage_products',
            'access_pos',           // Caja y Ventas
            'view_clients',
            'manage_clients',
            'view_purchases',       // Compras
            'manage_purchases',
            'view_stock',
            'manage_stock',
            'view_reports',         // Caja & Gastos, Reportes
            'manage_users',         // Usuarios & Roles
            'manage_settings',      // Parámetros
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }

        // 2. Create Roles
        
        // ADMIN: All access
        $adminRole = Role::firstOrCreate(['name' => 'admin']);
        $adminRole->givePermissionTo(Permission::all());

        // SELLER (Vendedor): Restricted access
        $sellerRole = Role::firstOrCreate(['name' => 'seller']);
        $sellerRole->syncPermissions([
            'view_dashboard',
            'view_products',
            'access_pos',
            'view_clients',
            // NO compras, NO stock management (only view maybe?), NO users, NO settings
        ]);

        // 3. Assign Role to existing users
        // Assign Admin to user ID 1 (Administrator usually)
        $admin = User::find(1);
        if ($admin && !$admin->hasRole('admin')) {
            $admin->assignRole('admin');
        }
        
        // Create a dummy Seller for testing if not exists
        $seller = User::where('email', 'vendedor@km21.com')->first();
        if (!$seller) {
            $seller = User::create([
                'name' => 'Vendedor Test',
                'email' => 'vendedor@km21.com',
                'password' => bcrypt('password'),
            ]);
            $seller->assignRole('seller');
        }
    }
}
