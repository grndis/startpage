import React, { useEffect, useState } from "react";
import { WidgetManager } from "app/WidgetManager";
import CreateWidgetDialog from "./CreateWidgetDialog";
import WidgetGrid, { defaultGridSettings, WidgetGridSettings } from "./WidgetGrid";
import SettingsDialog from "./settings/SettingsDialog";
import Background from "./backgrounds";
import { usePromise, useStorage } from "app/hooks";
import { defineMessages, FormattedMessage, IntlProvider, useIntl } from "react-intl";
import { getTranslation, getUserLocale } from "app/locale";
import { applyTheme, ThemeConfig } from "./settings/ThemeSettings";
import ReviewRequester from "./ReviewRequester";
import { storage } from "app/storage";
import * as Sentry from "@sentry/react";
import Onboarding from "./onboarding";
import { useBackground } from "app/hooks/background";
import { GlobalSearchContext } from "app/hooks/globalSearch";


const messages = defineMessages({
	newTab: {
		defaultMessage: "New Tab",
	},
});


function Title() {
	const intl = useIntl();

	if (typeof browser != "undefined") {
		document.title = intl.formatMessage(messages.newTab);
	}

	return null;
}


const widgetManager = new WidgetManager(storage);

export default function App() {
	const [loadingRes,] = usePromise(async () => {
		await widgetManager.load();
		return true;
	}, []);

	const [query, setQuery] = useState("");
	const [locale, setLocale] = useStorage<string>("locale", getUserLocale());
	const [messages] = usePromise(() => locale ? getTranslation(locale) : Promise.reject(null), [locale]);
	const [background, setBackground] = useBackground();
	const [theme, setTheme] = useStorage<ThemeConfig>("theme", {});
	const [createIsOpen, setCreateOpen] = useState(false);
	const [settingsIsOpen, setSettingsOpen] = useState(false);
	const [widgetsHidden, setWidgetsHidden] = useState(false);
	const [isLocked, setIsLocked] = useStorage<boolean>("locked", false);
	const [rawGridSettings, setGridSettings] = useStorage<WidgetGridSettings>(
		"grid_settings", { ...defaultGridSettings });
	const [onboardingIsOpen, setOnboardingIsOpen] = useState<boolean | undefined>(undefined);
	const loaded = loadingRes != null && messages != null;
	useEffect(() => {
		if (loaded && onboardingIsOpen == undefined) {
			setOnboardingIsOpen(widgetManager.widgets.length == 0);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [loaded]);

	const gridSettings = rawGridSettings && { ...defaultGridSettings, ...rawGridSettings };

	if (theme) {
		applyTheme(theme);
	}

	const classes: string[] = [];
	if (widgetsHidden) {
		classes.push("hidden");
	}

	classes.push(isLocked ? "locked" : "unlocked");

	return (
		<IntlProvider locale={(messages && locale) ? locale : "en"} defaultLocale="en" messages={messages ?? undefined}>
			<GlobalSearchContext.Provider value={{ query, setQuery }}>
				<Title />
				<div className={classes.join(" ")}>
					<Sentry.ErrorBoundary fallback={<div id="background"></div>}>
						<Background background={background} setWidgetsHidden={setWidgetsHidden} />
					</Sentry.ErrorBoundary>
					{createIsOpen && (<CreateWidgetDialog
						manager={widgetManager}
						onClose={() => setCreateOpen(false)} />)}
					{gridSettings && (
						<SettingsDialog
							isOpen={settingsIsOpen}
							onClose={() => setSettingsOpen(false)}
							background={background} setBackground={setBackground}
							theme={theme} setTheme={setTheme}
							locale={locale ?? "en"} setLocale={setLocale}
							grid={gridSettings} setGrid={setGridSettings} />)}

					{loaded && gridSettings &&
						<WidgetGrid {...gridSettings} wm={widgetManager} isLocked={isLocked ?? false} />}
					{onboardingIsOpen && (
						<Onboarding
							onClose={() => setOnboardingIsOpen(false)}
							locale={locale ?? "en"} setLocale={setLocale}
							manager={widgetManager} />)}
					<ReviewRequester />

					<footer className="text-shadow">
						{isLocked && (
							<a onClick={() => setIsLocked(false)} tabIndex={0}>
								<i className={"large fas mr-1 " +
									(isLocked ? "fa-lock" : "fa-lock")} />
							</a>)}

						{!isLocked && (
							<>
								<a onClick={() => setCreateOpen(true)} tabIndex={0}>
									<i className="fas fa-plus mr-1" />
									<FormattedMessage
										defaultMessage="Add Widget" />
								</a>
								<a id="open-settings" onClick={() => setSettingsOpen(true)} className="ml-3">
									<i className="large fas fa-cog" />
								</a>
								<a onClick={() => setIsLocked(true)} className="ml-3">
									<i className="large fas mr-1 fa-lock-open" />
								</a>
							</>)}
					</footer>
				</div>
			</GlobalSearchContext.Provider>
		</IntlProvider>);
}
