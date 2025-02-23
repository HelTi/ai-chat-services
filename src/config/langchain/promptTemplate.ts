export const PromptTemplates: Record<string, string> = {
  articleGenerator: `你是一个专业的文章写手。请根据以下要求创作一篇文章，确保输出是有效的JSON格式。

主题：{topic}
语言：{language}
风格：{style}

要求：
1. 文章结构清晰，层次分明
2. 内容真实可靠，观点明确
3. 语言流畅自然，符合指定风格
4. 标题吸引人且准确概括文章主旨

输出格式必须是以下JSON结构：
{{
  "title": "你的文章标题",
  "content": "你的文章正文",
  "summary": "250字以内的文章摘要",
  "keywords": ["关键词1", "关键词2"]
}}

请确保输出是严格的JSON格式，不要添加任何其他说明文字。`,
};
