import { BackgroundConfig, BackgroundMode } from "app/hooks/background";
import { useAPI, useStorage } from "app/hooks";
import React, { CSSProperties } from "react";


interface BackgroundInfo {
	id: string;
	title?: string;
	color?: string;
	url: string;
	author: string;
	site: string;
	links: {
		photo: string;
		author: string;
		site: string;
	};
}


interface CreditProps {
	info: BackgroundInfo;
	setIsHovered?: (value: boolean) => void;
	onLike?: (info: BackgroundInfo) => void;
	onBlock?: (info: BackgroundInfo) => void;
}

function Credits(props: CreditProps) {
	const setIsHovered = props.setIsHovered ?? (() => {});

	if (props.info.links.author || props.info.links.site) {
		const title = (props.info.title && props.info.title.length > 0)
				? props.info.title : "Photo";
		return (
			<div className="credits text-shadow-soft"
					onMouseEnter={() => setIsHovered(true)}
					onMouseLeave={() => setIsHovered(false)}>
				<a className="title" href={props.info.links.photo}>{title}</a>
				<a href={props.info.links.author}>{props.info.author}</a>
				&nbsp;/&nbsp;
				<a href={props.info.links.site} className="mr-2">{props.info.site}</a>

				{props.onLike &&
					<a onClick={() => props.onLike!(props.info)}
							className="btn btn-sm" title="Like">
						<i className="fas fa-thumbs-up" />
					</a>}

				{props.onBlock &&
					<a onClick={() => props.onBlock!(props.info)}
							className="btn btn-sm" title="Never show again">
						<i className="fas fa-ban" />
					</a>}
			</div>);
	} else {
		return (
			<div className="credits text-shadow-soft"
					onMouseEnter={() => setIsHovered(true)}
					onMouseLeave={() => setIsHovered(false)}>
				<a href={props.info.links.photo}>
					<span className="title">{props.info.title}</span>
					<span>
						{props.info.author} / {props.info.site}
					</span>
				</a>
			</div>);
	}
}


interface BackgroundProps {
	background: BackgroundConfig | null;
	setWidgetsHidden?: (value: boolean) => void;
}


function reportVote(info: BackgroundInfo, isPositive: boolean) {
	const url = new URL(config.API_URL);
	url.pathname = (url.pathname + "background/vote/").replaceAll("//", "/");

	fetch(new Request(url.toString(), {
		method: "POST",
		cache: "no-cache",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			background: {
				id: info.id,
				url: info.links.photo,
			},
			is_positive: isPositive,
		}),
	})).catch(console.error);
}


function useAutoBackground(blocked: Set<string>): [(BackgroundInfo | undefined), (any | undefined)] {
	const [backgrounds, error] = useAPI<BackgroundInfo[]>("background/", {}, []);

	if (backgrounds && backgrounds.length > 0) {
		for (let i = 0; i < backgrounds.length; i++) {
			if (!blocked.has(backgrounds[i].id)) {
				return [backgrounds[i], undefined];
			}
		}

		return [backgrounds[0], undefined];
	} else {
		return [undefined, error];
	}
}


function AutoBackground(props: BackgroundProps) {
	const style: CSSProperties = {};

	const [blocked, setBlocked] = useStorage<string[]>("blocked_backgrounds");
	const blockedSet = new Set(blocked ?? []);

	const [liked, setLiked] = useStorage<string[]>("liked_backgrounds");
	const likedSet = new Set(liked ?? []);

	const [background, error] = useAutoBackground(blockedSet);
	if (background) {
		function handleBlock(info: BackgroundInfo) {
			reportVote(info, false);
			blockedSet.add(info.id);
			setBlocked(Array.from(blockedSet.values()));
		}

		function handleLike(info: BackgroundInfo) {
			reportVote(info, true);
			likedSet.add(info.id);
			setLiked(Array.from(likedSet.values()));
		}

		if (background.color) {
			style.backgroundColor = background.color;
		}
		style.backgroundImage = `url('${background.url}')`;
		return (
			<>
				<div id="background" style={style} />
				<Credits info={background} setIsHovered={props.setWidgetsHidden}
					onBlock={handleBlock} onLike={handleLike} />
			</>);
	} else {
		if (error) {
			style.backgroundColor = props.background!.values.color ?? "#336699";
		}
		return (<div id="background" style={style} />);
	}
}


function UnsplashBackground(props: BackgroundProps) {
	const style: CSSProperties = {};

	const collection = props.background?.values.collection;
	if (collection == undefined) {
		console.error("Collection not defined");
		return (<div id="background" style={style} />);
	}

	const [info, error] = useAPI<BackgroundInfo>("unsplash/",
			{ collection: collection }, []);
	if (info) {
		if (info.color) {
			style.backgroundColor = info.color;
		}
		style.backgroundImage = `url('${info.url}')`;
		return (
			<>
				<div id="background" style={style} />
				<Credits info={info} setIsHovered={props.setWidgetsHidden} />
			</>);
	} else {
		if (error) {
			style.backgroundColor = props.background!.values.color ?? "#336699";
		}
		return (<div id="background" style={style} />);
	}
}


export default function Background(props: BackgroundProps) {
	const background = props.background;

	const style: CSSProperties = {};
	if (background) {
		switch (background.mode) {
		case BackgroundMode.Auto:
			return (<AutoBackground {...props} />);
		case BackgroundMode.Color:
			style.backgroundColor = background.values.color ?? "#336699";
			break;
		case BackgroundMode.ImageUrl:
			style.backgroundImage = `url('${background.values.url}')`;
			style.backgroundPosition = background.values.position;
			break;
		case BackgroundMode.Unsplash:
			return (<UnsplashBackground {...props} />);
		}
	}

	return (<div id="background" style={style} />);
}
