import React from "react";
import SyntaxHighlighter from "react-syntax-highlighter";
import { tomorrowNight } from "react-syntax-highlighter/styles/hljs";

export class CodeBlock extends React.PureComponent {
	render() {
		return (
			<SyntaxHighlighter language={this.props.language} style={tomorrowNight}>
				{this.props.value}
			</SyntaxHighlighter>
		);
	}
}

CodeBlock.defaultProps = {
	language: "",
};
