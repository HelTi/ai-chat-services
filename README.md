## AI 工具
基于 nestjs、openai、LangChain。

适用于兼容 openai 的第三方接口，如OpenAI、DeepSeek、通义千问等。

## 配置
文件 .env_template 改成 .env
```shell
PORT=3030 # 服务端口

DEEPSEEK_API_KEY=sk-xxx
OPENAI_API_KEY=sk-xxx
OPENAI_API_BASE_URL=https://api

AI_MODEL=gpt-4
```

## 命令

开发模式
```shell
npm run dev 
```

生产模式
```shell
npm run build

npm run start:prod

````

## 接口列表
