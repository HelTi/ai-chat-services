module.exports = {
  apps: [{
    name: 'ai-chat-services',
    script: 'dist/main.js',  // 直接指向编译后的文件
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3030
    }
  }]
}
