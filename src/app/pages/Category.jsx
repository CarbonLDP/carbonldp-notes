import React from "react";
import { Link, Route } from "react-router-dom";

import { buildMarkdownPage } from "./markdownPage";

export class Category extends React.Component {
	render() {
		return (
			<div class="columns">
				<div class="column is-narrow" style={{ width: "200px" }}>
					{this._buildMenu()}
				</div>
				<div class="column">{this._buildRoutes()}</div>
				<div class="column is-narrow is-hidden-touch" style={{ width: "200px" }} />
			</div>
		);
	}

	_buildMenu() {
		const elements = this.props.notes.map(note => {
			return (
				<li>
					<Link key={note.route} to={`${this.props.base}${note.route}`}>
						{note.title}
					</Link>
				</li>
			);
		});
		return (
			<aside
				class="menu"
				style={{
					padding: "10px 20px 0 10px",
				}}
			>
				<p class="menu-label">Documents</p>
				<ul class="menu-list">{elements}</ul>
			</aside>
		);
	}
	_buildRoutes() {
		return this.props.notes.map(note => {
			const component = buildMarkdownPage(note.content);
			return <Route id={note.route} path={`${this.props.base}${note.route}`} component={component} />;
		});
	}
}
