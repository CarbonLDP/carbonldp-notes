import React from "react";
import { BrowserRouter, Link, Route } from "react-router-dom";
import classNames from "classnames";

import { Index } from "./pages/Index";
import { Meetings } from "./pages/Meetings";
import { Designs } from "./pages/Designs";

export class App extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			menuIsActive: false,
		};

		this.categories = [Meetings, Designs];

		this.handleBurgerClick = this.handleBurgerClick.bind(this);
	}

	handleBurgerClick() {
		this.toggleMenu();
	}

	toggleMenu(active) {
		this.setState((previousState, props) => {
			active = typeof active === "undefined" ? !previousState.menuIsActive : active;
			return { menuIsActive: active };
		});
	}

	render() {
		return (
			<BrowserRouter>
				<div>
					<nav class="navbar is-fixed-top is-dark" aria-label="main navigation">
						<div class="navbar-brand">
							<div
								role="button"
								class="navbar-burger burger"
								aria-label="menu"
								aria-expanded="false"
								onClick={this.handleBurgerClick}
							>
								<span aria-hidden="true" />
								<span aria-hidden="true" />
								<span aria-hidden="true" />
							</div>
						</div>
						<div
							className={classNames("navbar-menu", {
								"is-active": this.state.menuIsActive,
							})}
							onClick={this.toggleMenu.bind(this, false)}
						>
							<div class="navbar-start">{this._buildLinks()}</div>
						</div>
					</nav>
					<div>
						<Route id={"/"} exact path={"/"} component={Index} />
						{this._buildRoutes()}
					</div>
				</div>
			</BrowserRouter>
		);
	}

	_buildLinks() {
		return this.categories.map(category => {
			return (
				<Link key={category.route} className="navbar-item" to={category.route}>
					{category.label}
				</Link>
			);
		});
	}

	_buildRoutes() {
		return this.categories.map(category => {
			return <Route key={category.route} path={category.route} component={category} />;
		});
	}
}

const app = <App />;
export default app;
