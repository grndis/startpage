import Schema, { type } from "app/utils/Schema";
import { Vector2 } from "app/utils/Vector2";
import React from "react";

interface SearchProps {
	searchTitle: string;
	searchURL: string;
}

export default function Search(props: SearchProps) {
	return (
		<div className="panel flush">
			<form method="get" action={props.searchURL}>
				<input autoFocus={true} type="text" name="q" placeholder={`Search with ${props.searchTitle}`} className="large invisible" />
			</form>
		</div>);
}


Search.description = "Search box to your favourite search engine";

Search.initialProps = {
	searchTitle: "Google",
	searchURL: "https://google.com/search"
};

Search.schema = {
	searchTitle: type.string("Search engine name"),
	searchURL: type.url("URL"),
} as Schema;

Search.defaultSize = new Vector2(15, 1);
