#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import readline from 'readline';

console.log('🚀 Interactive Demo Account Setup');
console.log('=================================\n');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function getCredentials() {
  console.log('📝 Masukkan kredensial Supabase kamu:');
  console.log('=====================================\n');
  
  const supabaseUrl = await question('🌐 Supabase Project URL (https://your-project.supabase.co): ');
  const serviceKey = await question('🔑 Service Role Key (sk_...): ');
  
  if (!supabaseUrl || !serviceKey) {
    console.log('❌ Kredensial tidak lengkap!');
    rl.close();
    process.exit(1);
  }
  
  return { supabaseUrl, serviceKey };
}

const demoAccounts = [
  {
    email: 'designer@demo.com',
    password: 'demo123',
    fullName: 'Demo Designer',
    role: 'designer'
  },
  {
    email: 'cashier@demo.com',
    password: 'demo123',
    fullName: 'Demo Kasir',
    role: 'cashier'
  },
  {
    email: 'operator@demo.com',
    password: 'demo123',
    fullName: 'Demo Operator',
    role: 'operator'
  }
];

async function createDemoAccounts(supabaseUrl, serviceKey) {
  console.log('\n🔧 Membuat akun demo...');
  console.log(`🌐 URL: ${supabaseUrl}`);
  console.log(`📧 Total akun: ${demoAccounts.length}\n`);

  // Create Supabase client
  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    // Test connection
    console.log('🔍 Menguji koneksi...');
    const { data: testData, error: testError } = await supabase
      .from('user_roles')
      .select('count')
      .limit(1);
    
    if (testError && !testError.message.includes('does not exist')) {
      console.log('❌ Koneksi gagal:', testError.message);
      console.log('💡 Pastikan migrasi database sudah dijalankan!');
      return false;
    }
    console.log('✅ Koneksi berhasil!\n');

    for (const account of demoAccounts) {
      console.log(`📧 Membuat akun: ${account.email}`);
      
      // Check if user already exists
      try {
        const { data: existingUsers } = await supabase.auth.admin.listUsers();
        const existingUser = existingUsers.users.find(u => u.email === account.email);
        
        if (existingUser) {
          console.log('   ✅ User sudah ada');
          
          // Check/add role
          const { data: existingRole } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', existingUser.id)
            .single();
          
          if (!existingRole) {
            const { error: roleError } = await supabase
              .from('user_roles')
              .insert({ 
                user_id: existingUser.id, 
                role: account.role 
              });
            
            if (roleError) {
              console.log(`   ❌ Error role: ${roleError.message}`);
            } else {
              console.log(`   ✅ Role ${account.role} ditambahkan`);
            }
          } else {
            console.log(`   ✅ Role ${account.role} sudah ada`);
          }
        } else {
          // Create new user
          const { data, error } = await supabase.auth.admin.createUser({
            email: account.email,
            password: account.password,
            email_confirm: true,
            user_metadata: {
              full_name: account.fullName
            }
          });
          
          if (error) {
            console.log(`   ❌ Error: ${error.message}`);
            continue;
          }
          
          console.log('   ✅ User dibuat');
          
          // Add role
          if (data.user) {
            const { error: roleError } = await supabase
              .from('user_roles')
              .insert({ 
                user_id: data.user.id, 
                role: account.role 
              });
            
            if (roleError) {
              console.log(`   ⚠️  Error role: ${roleError.message}`);
            } else {
              console.log(`   ✅ Role ${account.role} ditambahkan`);
            }
          }
        }
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
      }
      
      console.log('');
    }
    
    console.log('🎉 Setup selesai!');
    console.log('\n📋 Akun Demo:');
    console.log('=============');
    demoAccounts.forEach(account => {
      console.log(`📧 ${account.email}`);
      console.log(`🔑 demo123`);
      console.log(`👤 ${account.role}`);
      console.log('');
    });
    
    console.log('✨ Sekarang coba login di: http://localhost:5174');
    return true;
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.message.includes('Invalid API key')) {
      console.log('\n💡 Pastikan:');
      console.log('1. Menggunakan service_role key (bukan anon key)');
      console.log('2. Service role key dimulai dengan "sk_"');
      console.log('3. Project URL benar');
    }
    
    return false;
  }
}

async function main() {
  try {
    const { supabaseUrl, serviceKey } = await getCredentials();
    const success = await createDemoAccounts(supabaseUrl, serviceKey);
    
    rl.close();
    
    if (success) {
      console.log('\n🎯 Setup berhasil! Silakan test login.');
    } else {
      console.log('\n❌ Setup gagal. Periksa kredensial dan migrasi database.');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    rl.close();
  }
}

main();
