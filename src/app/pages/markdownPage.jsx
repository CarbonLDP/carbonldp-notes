import React from "react";
import ReactMarkdown from "react-markdown";

import { CodeBlock } from "./../components/CodeBlock";

const renderers = {
	code: CodeBlock,
};

export function buildMarkdownPage(content) {
	return () => {
		return (
			<div
				style={{
					padding: "10px 20px 0",
				}}
				class="content"
			>
				<ReactMarkdown source={content} renderers={renderers} escapeHtml={false} />
			</div>
		);
	};
}
