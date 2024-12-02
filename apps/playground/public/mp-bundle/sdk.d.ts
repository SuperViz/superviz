// 24.11.2_webgl-798-gf42d1db434
/// <reference types="webxr" />

import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';

export type Vector2 = {
	x: number;
	y: number;
};
export type Vector3 = {
	x: number;
	y: number;
	z: number;
};
export type Rotation = {
	x: number;
	y: number;
	z?: number;
};
/**
 * An orientation described with Euler-like angles in degrees.
 */
export type Orientation = {
	yaw: number;
	pitch: number;
	roll: number;
};
export type Size = {
	w: number;
	h: number;
};
/**
 * An RGB represenation of a color.
 * Each property is normalized to the range [0, 1]
 */
export type Color = {
	r: number;
	g: number;
	b: number;
};
/**
 * An object representing an observer that is subscribed to an observable.
 */
export interface ISubscription {
	/**
	 * Removes the observer from the observable so that it stops receiving updates.
	 */
	cancel(): void;
}
/**
 * A callback that can be subscribed to changes of an [[IObservable]]
 *
 * The functional style version of the [[IObserver]]
 * @param <DataT> The type of the data being observed.
 */
export type ObserverCallback<DataT> = (data: DataT) => void;
/**
 * An observer that can be subscribed to changes of an [[IObservable]]
 *
 * The object-oriented version of the [[ObserverCallback]]
 * @param <DataT> The type of the data being observed.
 */
export interface IObserver<DataT> {
	/** Called when the data in the [[IObservable]] has changed. */
	onChanged(data: DataT): void;
}
/**
 * A callback that describes a condition of an [[IObservable]] to wait for.
 * Returning true will resolve the promise returned by [[IObservable.waitUntil]]
 *
 * The functional style version of the [[ICondition]]
 * @param <DataT> The type of the data to check conditions on.
 */
export type ConditionCallback<DataT> = (data: DataT) => boolean;
/**
 * An observer-like object that describes a condition to wait for on an [[IObservable]]
 *
 * The object-oriented version of the [[ConditionCallback]]
 * @param <DataT> The type of the data to check conditions on.
 */
export interface ICondition<DataT> {
	/**
	 * Called when the data in the [[IObservable]] has changed.
	 * Returning true will resolve the promise returned by [[IObservable.waitUntil]]
	 */
	waitUntil(data: DataT): boolean;
}
/**
 * A data object that can have its changes observed via subscribing an [[IObserver]] or [[ObserverCallback]]
 * @param <DataT> The type of the data being observed.
 */
export interface IObservable<DataT> {
	/**
	 * Subscribe to changes on this object.
	 * When this observable detects a change, the `observer` provided will be called with the data associated with this observable.
	 * @param observer
	 * @returns {ISubscription} A subscription that can be used to remove the subscribed observer.
	 */
	subscribe(observer: IObserver<DataT> | ObserverCallback<DataT>): ISubscription;
	/**
	 * Wait for a specific condition on this object to be met.
	 * When this observable detects a change, the `condition` provided will be called. When the `condition` returns true, the returned Promise will be resolved.
	 * @param {ICondition | ConditionCallback} condition
	 * @returns {Promise<void>} A promise that is resolved when `condition` returns true.
	 */
	waitUntil(condition: ICondition<DataT> | ConditionCallback<DataT>): Promise<DataT>;
}
/**
 * An observer that can subscribe to changes of an [[IObservableMap]]
 *
 * @param <ItemT> The type of the items in the map.
 */
export interface IMapObserver<ItemT> {
	/** Called when an item is added with the `index`, the new `item`, and current state of the `collection`. */
	onAdded?(index: string, item: ItemT, collection: Dictionary<ItemT>): void;
	/** Called when an item is removed, with the `index`, the removed `item`, and current state of the `collection`. */
	onRemoved?(index: string, item: ItemT, collection: Dictionary<ItemT>): void;
	/** Called when an existing item is altered, with the `index`, the new `item`, and current state of the `collection`. */
	onUpdated?(index: string, item: ItemT, collection: Dictionary<ItemT>): void;
	/**
	 * Called when a set of changes happens within the `collection`.
	 * For example, this can be used to get the initial state of the collection instead of receiving individual `onAdded` calls for each item.
	 */
	onCollectionUpdated?(collection: Dictionary<ItemT>): void;
}
/**
 * A map that can have its changes observed via subscribing an [[IMapObserver]]
 *
 * For each observer subscribed to this `IObservableMap`:
 * - `observer.onAdded` will be called when an item is added to the collection
 * - `observer.onRemoved` will be called when an item is removed from the collection
 * - `observer.onUpdated` will be called when an item has some of its properties changed
 * - `observer.onCollectionUpdated` will be called when some set of the above events have occured (item added/removed/updated)
 *
 * When first subscribing, the observers' `onAdded` will be called for each item in the collection, and then again as items are added.
 * Alternatively, the `onCollectionUpdated` will always give an up-to-date view of the collection.
 * `onCollectionUpdated`, on first subscription, will be called once with the entire collection, and then again as changes to the collection  occur.
 *
 * @param <ItemT> The type of the items in the map being observed.
 */
export interface IObservableMap<ItemT> {
	/**
	 * Subscribe to changes in this map.
	 * When this observable detects a change, the `observer` provided will have its `onAdded`, `onRemoved`, and/or `onUpdated` called.
	 * @param observer
	 * @returns {ISubscription} A subscription that can be used to remove the subscribed observer.
	 */
	subscribe(observer: IMapObserver<ItemT>): ISubscription;
}
/**
 * A homogenous collection of items indexable by string like a standard JavaScript object.
 * Can also be iterated with a `for..of` loop.
 *
 * @param <ItemT> The type of each item in this collection.
 */
export interface Dictionary<ItemT> {
	/**
	 * Iterate all items in the collection using `for..of`.
	 * ```typescript
	 * for (const [key, item] of collection) {
	 *   console.log(`the collection contains ${item} at the index ${key}`);
	 * }
	 * ```
	 */
	[Symbol.iterator](): IterableIterator<[
		string,
		ItemT
	]>;
	/** Get an item using a specific `key`. */
	[key: string]: ItemT;
}
/**
 * An interface that is used to indicate that a resource or object is no longer needed.
 */
export interface IDisposable {
	dispose(): void;
}
declare function disconnect(): void;
export declare namespace App {
	enum Event {
		PHASE_CHANGE = "application.phasechange"
	}
	/**
	 * Application phases are returned as part of the [[state]] observable.
	 *
	 * ```
	 * mpSdk.App.state.subscribe(function (appState) {
	 *  if(appState.phase === mpSdk.App.Phase.LOADING) {
	 *    console.log('The app has started loading!')
	 *  }
	 *  if(appState.phase === mpSdk.App.Phase.STARTING) {
	 *    console.log('The transition into the start location begins!')
	 *  }
	 *  if(appState.phase === mpSdk.App.Phase.PLAYING) {
	 *    console.log('The app is ready to take user input now!')
	 *  }
	 * });
	 * ```
	 */
	enum Phase {
		UNINITIALIZED = "appphase.uninitialized",
		WAITING = "appphase.waiting",
		LOADING = "appphase.loading",
		STARTING = "appphase.starting",
		PLAYING = "appphase.playing",
		ERROR = "appphase.error"
	}
	/**
	 * Application
	 */
	enum Application {
		UNKNOWN = "application.unknown",
		WEBVR = "application.webvr",
		SHOWCASE = "application.showcase",
		WORKSHOP = "application.workshop"
	}
	/**
	 * Feature availability and activation data is returned as a part of the [[features]] observable.
	 */
	enum Feature {
		RoomBounds = "feature.roombounds"
	}
	/**
	 * @deprecated This type is used by deprecated functionality. Use [[state]] observable.
	 */
	type AppState = {
		application: Application;
		phase: Phase;
	};
	/**
	 *  An observable collection of features and their state
	 *  'true'      - Feature is available
	 *  'false'     - Feature is not available
	 *  'undefined' - Feature availability cannot be determined.
	 */
	type Features = Record<Feature, boolean | undefined>;
	type State = {
		application: Application;
		phase: Phase;
		/**
		 * An object whose keys are phases from [[Phase]]
		 * and values are epoch time in milliseconds.
		 * The times are filled in after the phase has passed.
		 * ```
		 * {
		 *    phaseTimes: {
		 *      'appphase.uninitialized': 1570084156590,
		 *      'appphase.waiting': 0,
		 *      'appphase.loading': 0,
		 *      'appphase.starting': 0,
		 *      'appphase.playing': 0,
		 *      'appphase.error': 0,
		 *    }
		 * }
		 * ```
		 */
		phaseTimes: {
			[phase: string]: number;
		};
	};
	/**
	 *  App.Locale Module for Internal Use.
	 *
	 * @hidden
	 * @internal
	 * @experimental
	 */
	namespace Locale {
		/**
		 * Return the language code currently used by Showcase.
		 *
		 * ```
		 * const locale = await mpSdk.App.Locale.getLanguageCode();
		 * ```
		 *
		 * @return string
		 *
		 * @hidden
		 * @internal
		 * @experimental
		 */
		function getLanguageCode(): Promise<string>;
		/**
		 * Returns a translation function to use with registered strings.
		 *
		 * ```
		 * const t = mpSdk.App.Locale.getT();
		 * let string = t('EXPLORE_3D_SPACE');
		 * console.log(string);
		 * ```
		 * output (if locale is 'es'):
		 * > Explorar el espacio 3D
		 *
		 * @return t(key: string, options?: number): string
		 *
		 * @hidden
		 * @internal
		 * @experimental
		 *
		 */
		function getT(): Promise<(key: string, options?: number) => string>;
	}
}
export interface App {
	Event: typeof App.Event;
	Feature: typeof App.Feature;
	Phase: typeof App.Phase;
	Application: typeof App.Application;
	/**
	 * An observable list of features, their availability and their presence in Showcase.
	 *
	 * ```typescript
	 * App.features.subscribe({
	 *   onChanged(features) {
	 *     // room bounds setting has changed
	 *     if (features[App.Feature.RoomBounds] !== undefined) {
	 *       console.log('RoomBounds are ', features[App.Feature.RoomBounds] ? 'available' : 'unavailable');
	 *     }
	 *     else {
	 *       console.log('RoomBounds are unavailable.');
	 *     }
	 *   }
	 * });
	 * ```
	 * @embed
	 * @bundle
	 * @introduced 24.9.3
	 */
	features: IObservable<App.Features>;
	/**
	 * @deprecated Use [[state]] observable to get the current phase or application.
	 */
	getState(): Promise<App.AppState>;
	/**
	 * @deprecated Use [[state]] observable to get load times.
	 */
	getLoadTimes(): Promise<{
		[key in App.Phase]: null | number;
	}>;
	/**
	 * An observable application state object.
	 *
	 * ```
	 * mpSdk.App.state.subscribe(function (appState) {
	 *  // app state has changed
	 *  console.log('The current application: ', appState.application);
	 *  console.log('The current phase: ', appState.phase);
	 *  console.log('Loaded at time ', appState.phaseTimes[mpSdk.App.Phase.LOADING]);
	 *  console.log('Started at time ', appState.phaseTimes[mpSdk.App.Phase.STARTING]);
	 * });
	 *
	 * output
	 * > The current application: application.showcase
	 * > The current phase: appphase.waiting
	 * > Loaded at time 1570084156590
	 * > Started at time 1570084156824
	 * >
	 * ```
	 */
	state: IObservable<App.State>;
	Locale: {
		/**
		 * Return the language code currently used by Showcase.
		 *
		 * ```
		 * const locale = await mpSdk.App.Locale.getLanguageCode();
		 * ```
		 *
		 * @return string
		 *
		 * @hidden
		 * @internal
		 * @experimental
		 */
		getLanguageCode(): Promise<string>;
		/**
		 * Returns a translation function to use with registered strings.
		 * Options can be a number to show plurality.
		 *
		 * ```
		 * const t = mpSdk.App.Locale.getT();
		 * let string = t('EXPLORE_3D_SPACE');
		 * console.log(string);
		 * ```
		 * output (if locale is 'es'):
		 * > Explorar el espacio 3D
		 *
		 * @return t(key: string, options?: unknown): string
		 *
		 * @hidden
		 * @internal
		 * @experimental
		 *
		 */
		getT(): Promise<(key: string, options?: number) => string>;
	};
}
export declare namespace Asset {
	/**
	 * @hidden
	 * @internal
	 * @experimental
	 */
	type VrColorplanMetadata = {
		height: number;
		imageOriginX: number;
		imageOriginY: number;
		resolutionPpm: number;
		width: number;
	};
	/**
	 * @hidden
	 * @internal
	 * @experimental
	 */
	type VrColorplanData = {
		data: VrColorplanMetadata;
		imageDataUrls: string[];
	};
	/**
	 * @hidden
	 * @internal
	 * @experimental
	 */
	interface IAttachment {
		id: string;
		created: Date;
		mediaType: MediaType;
		category: AttachmentCategory;
		parentId?: string;
		parentType: ParentType;
		filename?: string;
		bytes?: number;
		mimeType?: string;
		/** source url - prefer `url.get()` over this. */
		src: string;
		/** expiring url */
		url: ExpiringResource<string>;
		/** expiring thumbnail url */
		thumbnailUrl: ExpiringResource<string>;
		height: number;
		width: number;
	}
	/**
	 * @hidden
	 * @internal
	 * @experimental
	 */
	enum MediaType {
		IMAGE = "image",
		PDF = "pdf",
		VIDEO = "video",
		RICH = "rich",
		ZIP = "zip",
		TEXT = "text",
		AUDIO = "audio",
		MODEL = "model",
		APPLICATION = "application"
	}
	/**
	 * @hidden
	 * @internal
	 * @experimental
	 */
	enum AttachmentCategory {
		EXTERNAL = "external",
		UPLOAD = "upload",
		SANDBOX = "sandbox"
	}
	/**
	 * @hidden
	 * @internal
	 * @experimental
	 */
	enum ParentType {
		COMMENT = "comment",
		MATTERTAG = "mattertag"
	}
	/**
	 * @hidden
	 * @internal
	 * @experimental
	 */
	type ExpiringResource<T> = {
		get(): Promise<T>;
		onStale?: () => Promise<void>;
		validUntil: Date | null;
	};
}
export interface Asset {
	/**
	 * Get colorplan data URLs and metadata. The optional sid has one caveat, it assumes that the floor count of the other space is the same as the current space.
	 * See https://matterport.atlassian.net/browse/JSSDK-2160
	 *
	 * ```
	 * const { data, imageDataUrls } = await mpSdk.Asset.getVrColorplans();
	 * ```
	 *
	 * @param sid An optional string space sid. Used to access the colorplans of other spaces. Omitting this value defaults to the current space.
	 *
	 * @hidden
	 * @internal
	 * @experimental
	 */
	getVrColorplans(): Promise<Asset.VrColorplanData>;
	/**
   * @hidden
   * @internal
   * @experimental
   */
	getVrColorplans(sid: string): Promise<Asset.VrColorplanData>;
	/**
	 * Register a texture to use with subsequent calls like [[Tag.editIcon]].
	 *
	 * **Note**: It is recommended to host your own images to mitigate cross origin limitations.
	 *
	 * ```
	 * mpSdk.Asset.registerTexture('customTextureId', 'https://[link.to/image]');
	 * ```
	 *
	 * @param id A user specified string to use as a lookup of this texture
	 * @param iconSrc The src of the icon, like the src of an \<img>
	 *
	 * @embed
	 * @bundle
	 * @introduced 3.1.68.12-7-g858688944a
	 */
	registerTexture(id: string, iconSrc: string): Promise<void>;
	/**
	 * Gets an asset by specified ID. Throws an error if no
	 * asset with the desired ID exists.
	 * ```
	 * mpSdk.Asset.getAssetById('your-asset-id')
	 *   .then(async function(asset){
	 *     console.log('Asset URL is', await asset.url.get());
	 *   });
	 * ```
	 * @return A promise that resolves with the desired asset.
	 *
	 * @hidden
	 * @internal
	 * @experimental
	 */
	getAssetById(id: string): Promise<Asset.IAttachment>;
	/**
	 * Refresh assets from server, ensuring that all attachments are up to date.
	 *
	 * @hidden
	 * @internal
	 * @experimental
	 */
	refreshAssets(): Promise<void>;
}
export declare namespace Mode {
	enum Mode {
		INSIDE = "mode.inside",
		OUTSIDE = "mode.outside",
		DOLLHOUSE = "mode.dollhouse",
		FLOORPLAN = "mode.floorplan",
		TRANSITIONING = "mode.transitioning"
	}
	enum Event {
		/** @event */
		CHANGE_START = "viewmode.changestart",
		/** @event */
		CHANGE_END = "viewmode.changeend"
	}
	type TransitionData = {
		from: Mode | null;
		to: Mode | null;
	};
	enum TransitionType {
		INSTANT = "transition.instant",
		FLY = "transition.fly",
		FADEOUT = "transition.fade"
	}
	type MoveToModeOptions = {
		rotation?: Rotation;
		position?: Vector3;
		transition?: TransitionType;
		zoom?: number;
	};
	type CurrentViewmodeData = Mode | null;
}
export interface Mode {
	Mode: typeof Mode.Mode;
	Event: typeof Mode.Event;
	TransitionType: typeof Mode.TransitionType;
	/**
	 * The current view mode.
	 *
	 * ```
	 * mpSdk.Mode.current.subscribe(function (mode) {
	 *   // the view mode has changed
	 *   console.log('Current view mode is is ', mode);
	 * });
	 * ```
	 *
	 * @embed
	 * @bundle
	 * @introduced 3.1.68.12-7-g858688944a
	 */
	current: IObservable<Mode.Mode | null>;
	/**
	 * Change the viewing mode in 3D Showcase.
	 *
	 *```
	 * const mode = mpSdk.Mode.Mode.FLOORPLAN;
	 * const position = {x: 0, y: 0, z: 0};
	 * const rotation = {x: -90, y: 0};
	 * const transition = mpSdk.Mode.TransitionType.FLY;
	 * const zoom = 5;
	 *
	 * mpSdk.Mode.moveTo(mode, {
	 *     position: position,
	 *     rotation: rotation,
	 *     transition: transition,
	 *     zoom,
	 *   })
	 *   .then(function(nextMode){
	 *     // Move successful.
	 *     console.log('Arrived at new view mode ' + nextMode);
	 *   })
	 *   .catch(function(error){
	 *     // Error with moveTo command
	 *   });
	 * ```
	 *
	 * Notes about transitions to Floorplan mode:
	 * * `zoom` option is only taken into account in Floorplan transitions, the lower the number,
	 *   the further the camera is zoomed in
	 * * The position of a floorplan view is determined by the X and Z arguments of the optional position object.
	 * * The rotation of a floorplan view is determined by the X and Y of the optional rotation object,
	 *   changing X changes the 'roll' of the view, similar to hitting the LEFT/RIGHT arrow keys in Showcase
	 *   floorplan view, changing the Y value has no analog in showcase, but changes the 'tilt' of the view.
	 *
	 * @param The mode.
	 * @param Options object, containing optional position, rotation, transition type
	 * @return A promise that resolves with the new mode once the mode has transitioned.
	 */
	moveTo(mode: Mode.Mode, options?: Mode.MoveToModeOptions): Promise<Mode.Mode>;
	/**
	 * An observable transition of the current viewmode. `from` and `to` will be null
	 * if there is no active transition.
	 *
	 * ```
	 * mpSdk.Mode.transition.subscribe(function (transition) {
	 *   // the transition has changed
	 *   console.log(transition.from, transition.to, transition.progress);
	 * });
	 * ```
	 *
	 * @embed
	 * @bundle
	 * @introduced 3.1.68.12-7-g858688944a
	 */
	transition: IObservable<Mode.TransitionData>;
}
export declare namespace Camera {
	type Pose = {
		position: Vector3;
		rotation: Vector2;
		projection: Float32Array;
		sweep: string;
		mode: Mode.Mode;
	};
	enum Event {
		/** @event */
		MOVE = "camera.move"
	}
	enum Direction {
		FORWARD = "FORWARD",
		LEFT = "LEFT",
		RIGHT = "RIGHT",
		BACK = "BACK",
		UP = "UP",
		DOWN = "DOWN"
	}
	type RotateOptions = {
		/**
		 * Rotation speed in degrees per second.
		 */
		speed?: number;
	};
	type ZoomData = {
		/**
		 * The current zoom level
		 */
		level: number;
	};
}
export interface Camera {
	Event: typeof Camera.Event;
	Direction: typeof Camera.Direction;
	/**
	 * Returns the current state of camera.
	 * ```
	 * mpSdk.Camera.getPose()
	 *   .then(function(pose){
	 *     console.log('Current position is ', pose.position);
	 *     console.log('Rotation angle is ', pose.rotation);
	 *     console.log('Sweep UUID is ', pose.sweep);
	 *     console.log('View mode is ', pose.mode);
	 *   });
	 * ```
	 * @return A promise that resolves with the current state of the camera.
	 * @deprecated You can use the [[pose]] observable property instead.
	 */
	getPose(): Promise<Camera.Pose>;
	/**
	 * An observable pose data object that can be subscribed to.
	 *
	 * ```
	 * mpSdk.Camera.pose.subscribe(function (pose) {
	 *   // Changes to the Camera pose have occurred.
	 *   console.log('Current position is ', pose.position);
	 *   console.log('Rotation angle is ', pose.rotation);
	 *   console.log('Sweep UUID is ', pose.sweep);
	 *   console.log('View mode is ', pose.mode);
	 * });
	 * ```
	 */
	pose: IObservable<Camera.Pose>;
	/**
	 * Moves user to a different sweep relative to their current location
	 *
	 * ```
	 * const nextDirection = mpSdk.Camera.Direction.FORWARD;
	 *
	 * mpSdk.Camera.moveInDirection(nextDirection)
	 *   .then(function(){
	 *     console.log('The camera has moved forward.');
	 *   })
	 *   .catch(function(){
	 *     console.warning('An error occured while moving in that direction.');
	 *   });
	 * ```
	 * @param direction The direction.
	 * @return A promise that resolves when a sweep has been reached.
	 *
	 * **Errors**
	 *
	 * * Fails if direction is not one of the above options.
	 * * Warns if you can’t move in that direction (hit a wall).
	 *
	 * **Notes**
	 *
	 * This is the same behavior as if the user presses the arrow keys while in 3D Showcase.
	 *
	 * * Camera.Direction.UP is like moving forwards
	 * * Camera.Direction.DOWN is like moving backwards
	 *
	 * This action is for moving between sweeps while in Inside View.
	 */
	moveInDirection(direction: Camera.Direction): Promise<void>;
	/**
	 * Pans the camera.
	 *
	 * ```
	 * mpSdk.Camera.pan({ x: 1, z: 1 })
	 *   .then(function() {
	 *     // Pan complete.
	 *   })
	 *   .catch(function(error) {
	 *     // Pan error.
	 *   });
	 * ```
	 *
	 * @param params.x Absolute position of the sweep on the x axis.
	 * @param params.z Absolute position of the sweep on the z axis.
	 * @return A promise that resolves when the pan is complete.
	 *
	 * **Errors**
	 *
	 * * Warns if pan was successful but you hit the model bounds.
	 * * Fails if you are already at the model bounds and you cannot move any further.
	 *
	 * **Notes**
	 *
	 * The orientation of the axes depends on the sweep you were in before entering
	 * Floorplan and the aspect ratio of window.
	 *
	 * Only available in Dollhouse or Floorplan View. This is the same behavior as
	 * if the user uses the keyboard shortcuts W, A, S, and D or the arrow keys.
	 *
	 * Use `mpSdk.Camera.pan({ x: 0, z: 0 });` to return to directly above the
	 * very first sweep scanned.
	 */
	pan(params: {
		x: number;
		z: number;
	}): Promise<void>;
	/**
	 * Rotates the camera (user’s viewpoint).
	 *
	 * ```
	 * mpSdk.Camera.rotate(10, -20, { speed: 2 })
	 *   .then(function() {
	 *     // Camera rotation complete.
	 *   })
	 *   .catch(function(error) {
	 *     // Camera rotation error.
	 *   });
	 * ```
	 *
	 * @param vertical How many degrees to rotate up or down.
	 * @param horizontal How many degrees to rotate left or right.
	 * @param options
	 * @return A promise that resolves when the rotation is complete.
	 *
	 * **Errors**
	 *
	 * * Warns to console if you rotated, but then you hit the vertical limit.
	 * * Warns if trying to rotate up or down in Floorplan View.
	 * * Fails if no movement because you are already at a rotation limit.
	 *
	 * **Notes**
	 *
	 * If user is in Dollhouse or Floorplan View, the entire Matterport Space is rotated.
	 * * Positive values for horizontal means the Space rotates clockwise.
	 * * Negative values for horizontal counterclockwise rotations.
	 * * In Dollhouse view, vertical ranges from 0° (horizontal) to 80° above the Space.
	 * * In Floorplan view, the vertical value is ignored.
	 *
	 * If the user is in Inside View or 360º View, their viewpoint is rotated.
	 * * Positive values for horizontal means the user rotates clockwise.
	 * * Negative values for horizontal are counterclockwise rotations.
	 * * Vertical ranges from -70° (down) to 70° (up).
	 * * Tilting the view (similar to tilting one’s head) not supported.
	 *
	 * Rotation is relative to the user’s current viewpoint.
	 * This is the same behavior as if the user uses the keyboard shortcuts I, J, K, and L.
	 * Speeds less than or equal to zero are not allowed.
	 */
	rotate(horizontal: number, vertical: number, options?: Camera.RotateOptions): Promise<void>;
	/**
	 * Sets the orientation of the camera (user’s viewpoint) while in Panorama View.
	 *
	 * ```
	 * mpSdk.Camera.setRotation({ x: 10, y: -20 }, { speed: 2 })
	 *   .then(function() {
	 *     // Camera rotation complete.
	 *   })
	 *   .catch(function(error) {
	 *     // Camera rotation error.
	 *   });
	 * ```
	 *
	 * @param rotation The target rotation
	 * @param options
	 * @return A promise that resolves when the rotation is complete.
	 *
	 * **Errors**
	 * * Fails if the current view mode is not Panorama View.
	 *
	 * **Notes**
	 * * A target rotation can be retrieved from [[Camera.pose]]
	 * * Rotation is absolute so multiple calls will not further change orientation (floating point error notwithstanding).
	 * * Speeds less than or equal to zero are not allowed.
	 */
	setRotation(rotation: Rotation, options?: Camera.RotateOptions): Promise<void>;
	/**
	 * Rotates the camera to a specific screen coordinate.
	 * Coordinates are measure in pixels, relative to the WebGL Canvas' top left corner.
	 * See https://www.w3schools.com/graphics/canvas_coordinates.asp for more information on coordinates.
	 *
	 * ```
	 * mpSdk.Camera.lookAtScreenCoords(500, 320)
	 *   .then(function() {
	 *     // Camera rotation complete.
	 *   })
	 *   .catch(function(error) {
	 *     // Camera rotation error.
	 *   });
	 * ```
	 *
	 * @param {number} x Horizontal position, in pixels. Starting from the canvas' top left corner.
	 * @param {number} y Vertical position, in pixels. Starting from the canvas' top left corner.
	 * @returns {Promise<void>} A Promise that resolves when the rotation is complete.
	 *
	 * **Errors**
	 * * Fails if used outside of Inside mode.
	 * * Warns to console if you rotated, but then you hit the vertical limit.
	 * * Fails if no movement because you are already at a rotation limit.
	 */
	lookAtScreenCoords(x: number, y: number): Promise<void>;
	/**
	 * Zooms the camera to a percentage of the base field of view.
	 *
	 * Ex: Doubling the zoom, halves the field of view.
	 *
	 * ```
	 * mpSdk.Camera.zoomTo(2.0)
	 *  .then(function (newZoom) {
	 *    console.log('Camera zoomed to', newZoom);
	 *  });
	 * ```
	 *
	 * @param zoomLevel
	 *
	 * **Errors**
	 * * Fails if the current mode is not Inside mode.
	 * * Warns to console if the zoom level is outside of the zoom range supported.
	 */
	zoomTo(zoomLevel: number): Promise<number>;
	/**
	 * Zooms the camera by a percentage. The zoom delta is defined relative to the base field of view, not the current zoom.
	 * This means that the delta is strictly added, and not multiplied by the current zoom first.
	 *
	 *
	 * Ex: If at zoom 2.0, zooming by another 0.1x will bring the camera to 2.1x (2.0 + 0.1) not 2.2x (2.0 + 2.0 * 0.1)
	 *
	 * ```
	 * mpSdk.Camera.zoomBy(0.1)
	 *   .then(function (newZoom) {
	 *     console.log('Camera zoomed to', newZoom);
	 *   });
	 * ```
	 *
	 * @param zoomDelta
	 *
	 * **Errors**
	 * * Fails if the current mode is not Inside mode.
	 * * Warns to console if the zoom level would be outside of the zoom range supported.
	 */
	zoomBy(zoomDelta: number): Promise<number>;
	/**
	 * Reset the zoom of the camera back to 1.0x.
	 *
	 * ```
	 * mpSdk.Camera.zoomReset()
	 *   .then(function () {
	 *     console.log('Camera zoom has been reset');
	 *   })
	 * ```
	 *
	 * **Errors**
	 * * Fails if the current mode is not Inside mode.
	 */
	zoomReset(): Promise<void>;
	/**
	 * An observable zoom level of the camera in Panorama mode.
	 * The zoom level will be 1.0 for all other viewmodes.
	 *
	 * ```
	 * mpSdk.Camera.zoom.subscribe(function (zoom) {
	 *   // the zoom level has changed
	 *   console.log('Current zoom is ', zoom.level);
	 * });
	 * ```
	 */
	zoom: IObservable<Camera.ZoomData>;
}
export declare namespace Conversion { }
export interface Conversion {
	/**
	 * Converts a position of an object in 3d to the pixel coordinate on the screen
	 *
	 * @param worldPos Position of the object
	 * @param cameraPose The current pose of the Camera as received from Camera.pose.subscribe
	 * @param windowSize The current size of the Showcase player
	 * @param result An optional, pre-allocated Vector3 to store the result
	 *
	 * ```
	 * var showcase = document.getElementById('showcaseIframe');
	 * var showcaseSize = {
	 *  w: showcase.clientWidth,
	 *  h: showcase.clientHeight,
	 * };
	 * var cameraPose; // get pose using: mpSdk.Camera.pose.subscribe
	 * var mattertag; // get a mattertag from the collection using: mpSdk.Mattertag.getData
	 *
	 * var screenCoordinate = mpSdk.Conversion.worldToScreen(mattertag.anchorPosition, cameraPose, showcaseSize)
	 * ```
	 */
	worldToScreen(worldPos: Vector3, cameraPose: Camera.Pose, windowSize: Size, result?: Vector3): Vector3;
}
export declare namespace Floor {
	type Floors = {
		currentFloor: number;
		floorNames: string[];
		totalFloors: number;
	};
	type FloorData = {
		id: string;
		sequence: number;
		name: string;
	};
	type ObservableFloorData = {
		id: string | undefined;
		sequence: number | undefined;
		name: string;
	};
	enum Event {
		/** @event */
		CHANGE_START = "floors.changestart",
		/** @event */
		CHANGE_END = "floors.changeend"
	}
	namespace Conversion {
		/**
		 * Generate a map between v2 IDs and v1 IDs
		 *
		 * This method will help with migration between IDs used for floors.
		 *
		 * ```
		 * const mapping = await mpSdk.Floor.Conversion.createIdMap();
		 * ```
		 *
		 * @param invert?: boolean - if passed, return map of v1->v2 instead
		 */
		function createIdMap(invert?: boolean): Promise<Dictionary<string>>;
	}
}
export interface Floor {
	Event: typeof Floor.Event;
	Conversion: typeof Floor.Conversion;
	/**
	 * This function returns the state of all floors.
	 *
	 * ```
	 * mpSdk.Floor.getData()
	 *   .then(function(floors) {
	 *     // Floor data retreival complete.
	 *     console.log('Current floor: ' + floors.currentFloor);
	 *     console.log('Total floos: ' + floors.totalFloors);
	 *     console.log('Name of first floor: ' + floors.floorNames[0]);
	 *   })
	 *   .catch(function(error) {
	 *     // Floors data retrieval error.
	 *   });
	 * ```
	 * @deprecated Use the observable [[data]] collection instead
	 */
	getData(): Promise<Floor.Floors>;
	/**
	 * An observable collection of Floor data that can be subscribed to.
	 *
	 * See [[IObservableMap]] to learn how to receive data from the collection.
	 *
	 * ```
	 * mpSdk.Floor.data.subscribe({
	 *   onCollectionUpdated: function (collection) {
	 *     console.log('Collection received. There are ', Object.keys(collection).length, 'floors in the collection');
	 *   }
	 * });
	 * ```
	 */
	data: IObservableMap<Floor.FloorData>;
	/**
	 * An observable for the player's currently active floor.
	 *
	 * The current floor can tell you when "all floors" are visible and encodes when the camera is transitioning between floors.
	 *
	 * The following table shows all 4 states of the current floor observable
	 * (INSIDE: inside mode, DH: dollhouse mode, FP: floorplan mode).
	 *
	 * |          | at sweep (INSIDE) or floor (DH, FP) | all floors (DH, FP) | transitioning | in unplaced 360º view |
	 * |----------|-------------------------------------|---------------------|---------------|------------------------|
	 * | id       | `${current.id}`                     | ''                  | ''            | undefined              |
	 * | sequence | `${current.sequence}`               | -1                  | undefined     | undefined              |
	 * | name     | `${current.name}`                   | 'all'               | ''            | ''                     |
	 *
	 * ```
	 * mpSdk.Floor.current.subscribe(function (currentFloor) {
	 *   // Change to the current floor has occurred.
	 *   if (currentFloor.sequence === -1) {
	 *     console.log('Currently viewing all floors');
	 *   } else if (currentFloor.sequence === undefined) {
	 *     if (currentFloor.id === undefined) {
	 *       console.log('Current viewing an unplaced unaligned sweep');
	 *     } else {
	 *       console.log('Currently transitioning between floors');
	 *     }
	 *   } else {
	 *     console.log('Currently on floor', currentFloor.id);
	 *     console.log('Current floor\'s sequence index', currentFloor.sequence);
	 *     console.log('Current floor\'s name', currentFloor.name)
	 *   }
	 * });
	 * ```
	 */
	current: IObservable<Floor.ObservableFloorData>;
	/**
	 * When in inside mode, this function changes the active floor, and moves the camera to the nearest position on that floor.
	 * When in floorplan/dollhouse mode, this function changes the active floor, but does not modify the camera
	 *
	 * ```
	 * mpSdk.Floor.moveTo(2)
	 *   .then(function(floorIndex) {
	 *     // Move to floor complete.
	 *     console.log('Current floor: ' + floorIndex);
	 *   })
	 *   .catch(function(error) {
	 *     // Error moving to floor.
	 *   });
	 * ```
	 *
	 * @param index: The destination floor index
	 * @return The destination floor index.
	 */
	moveTo(index: number): Promise<number>;
	/**
	 * This function displays all floors.
	 *
	 * ```
	 * mpSdk.Floor.showAll()
	 *   .then(function(){
	 *     // Show floors complete.
	 *   })
	 *   .catch(function(error) {
	 *     // Error displaying all floors.
	 *   });
	 * ```
	 */
	showAll(): Promise<void>;
}
export declare namespace Graph {
	/**
	 * A descriptor for a graph vertex. Used when adding vertices to a graph.
	 */
	type VertexDescriptor<T> = {
		/** The id that can be used to lookup this vertex in the graph */
		id: string;
		/** Any user data to be associated with this vertex */
		data: T;
	};
	/**
	 * A descriptor for a graph vertex when no extra data will be associated with each vertex. Used when adding vertices to a graph.
	 */
	type VertexIdDescriptor = {
		/** The id that can be used to lookup this vertex in the graph */
		id: string;
	};
	/**
	 * A descriptor for a graph edge. Used when adding edges to a graph.
	 */
	type EdgeDescriptor<T> = {
		/** The source vertex. */
		src: Vertex<T>;
		/** The destination vertex. */
		dst: Vertex<T>;
		/** The weight of the edge. */
		weight?: number;
	};
	/**
	 * A node in the graph.
	 */
	type Vertex<T> = {
		/**
		 * The vertex's id.
		 */
		readonly id: string;
		/**
		 * User data associated with the vertex.
		 */
		readonly data: T;
		/**
		 * An iterable of all edges that have this vertex as its destination endpoint.
		 *
		 * ```typescript
		 * const vertex = graph.vertex('a');
		 * for (const edgeIn of vertex.edgesIn) {
		 *   console.log(`vertex "${edgeIn.dst.id}" has an edge coming in from a vertex "${edgeIn.src.id}"`);
		 * }
		 * ```
		 */
		readonly edgesIn: IterableIterator<Edge<T>>;
		/**
		 * An iterable of all edges that have this vertex as its source endpoint.
		 *
		 * ```typescript
		 * const vertex = graph.vertex('a');
		 * for (const edgeOut of vertex.edgesOut) {
		 *   console.log(`vertex "${edgeOut.src.id}" has an edge going to a vertex "${edgeOut.dst.id}"`);
		 * }
		 * ```
		 */
		readonly edgesOut: IterableIterator<Edge<T>>;
		/**
		 * An iterable of all vertices that can be traversed to from this vertex.
		 *
		 * ```typescript
		 * const vertex = graph.vertex('a');
		 * for (const neighbor of vertex.neighbors) {
		 *   console.log(`vertex "${vertex.id}" shares an edge with "${neighbor.id}");
		 * }
		 * ```
		 */
		readonly neighbors: IterableIterator<Vertex<T>>;
	};
	/**
	 * A weighted, directed connection between two vertices.
	 *
	 * @template T The type of any user data associated with each vertex in the graph.
	 */
	type Edge<T> = {
		/** The vertex at the source of this edge. */
		readonly src: Vertex<T>;
		/** The vertex at the destination of this edge. */
		readonly dst: Vertex<T>;
		/** The weight associated with this edge. */
		readonly weight: number;
	};
	/**
	 * A directed, weighted graph data structure.
	 *
	 * @template T The type of any user data associated with each vertex in the graph.
	 */
	interface IDirectedGraph<T> {
		/**
		 * Watch a collection and update the graph as the collection changes.
		 *
		 * **Note:** If you need a graph of enabled sweeps, use [[Sweep.createGraph]] instead of the code snippet below
		 *
		 * ```
		 * // create a graph of enabled sweeps
		 * const graph = mpSdk.createGraph();
		 * const sub = graph.watch({
		 *   collection: mpSdk.Sweep.collection,
		 *   isNeighborOf(sweepSrc, sweepDst) {
		 *     return sweepSrc.data.neighbors.includes(sweepDst.id);
		 *   },
		 *   neighborsOf(sweepVertex) {
		 *     return sweepVertex.data.neighbors.values();
		 *   },
		 *   weightBetween(sweepSrc, sweepDst) {
		 *     const dx = sweepDst.data.position.x - sweepSrc.data.position.x;
		 *     const dy = sweepDst.data.position.y - sweepSrc.data.position.y;
		 *     const dz = sweepDst.data.position.z - sweepSrc.data.position.z;
		 *     return Math.sqrt(dx ** 2 + dy ** 2 + dz ** 2);
		 *   },
		 *   shouldAdd(sweep) {
		 *     return sweep.enabled;
		 *   },
		 * });
		 *
		 * // some time later when the graph no longer needs updating
		 * sub.cancel();
		 * ```
		 * @param collectionAdaptor
		 * @returns ISubscription
		 */
		watch(collectionAdaptor: ICollectionAdaptor<T>): ISubscription;
		/**
		 * Add a vertex or set of vertices to the graph.
		 *
		 * ```typescript
		 * // for vertices with undefined "data" (no data associated with each vertex)
		 * const undefGraph = mpSdk.Graph.createDirectedGraph<undefined>();
		 * graph.addVertex(
		 *   { id: 'a' },
		 *   { id: 'b' },
		 * );
		 *
		 * // for vertices with any other data
		 * const graph = mpSdk.Graph.createDirectedGraph<number>();
		 * graph.addVertex(
		 *   { id: 'a', data: 1 },
		 *   { id: 'b', data: 2 },
		 * );
		 * ```
		 * @param vertexData A variable number of [[VertexDescriptor]]s to use to create nodes in the graph.
		 */
		addVertex(...vertexData: T extends undefined | void ? VertexIdDescriptor[] : Array<VertexDescriptor<T>>): void;
		/**
		 * Test if a vertex associated with `id` is present in the graph.
		 *
		 * ```typescript
		 * if (graph.hasVertex('a')) {
		 *   console.log('a vertex with id "a" was found');
		 * }
		 * ```
		 * @param id The vertex's id.
		 * @returns If a vertex with `id` exists, returns `true`. Otherwise, `false`.
		 */
		hasVertex(id: string): boolean;
		/**
		 * Get the vertex associated with `id`.
		 *
		 * ```typescript
		 * const a = graph.vertex('a');
		 * if (a) {
		 *   console.log(`Found a vertex with id "${a.id}"`);
		 * }
		 * ```
		 * @param id The vertex's id.
		 * @returns If a vertex with `id` exists, returns the `Vertex`. Otherwise, `undefined`.
		 */
		vertex(id: string): Vertex<T> | undefined;
		/**
		 * Remove a vertex or a set of vertices from the graph.
		 *
		 * ```typescript
		 * graph.removeVertex(a, b);
		 * ```
		 * @param vertices A variable number of vertices to remove.
		 */
		removeVertex(...vertices: Array<Vertex<T>>): void;
		/**
		 * An iterable of all vertices in the graph.
		 *
		 * ```typescript
		 * for (const vertex of graph.vertices) {
		 *   console.log(`vertex: ${vertex.id}`);
		 * }
		 * ```
		 */
		readonly vertices: IterableIterator<Vertex<T>>;
		/**
		 * The number of vertices in the graph.
		 *
		 * ```typescript
		 * console.log(`the graph has ${graph.vertexCount} vertices`);
		 * ```
		 */
		readonly vertexCount: number;
		/**
		 * Set the weight of an edge or set of edges between pairs of vertices representing the connections from `src` to `dst`.
		 *
		 * If an error is thrown, the graph is left untouched, no edges are added.
		 * ```typescript
		 * graph.setEdge(
		 *   { src: a, dst: b, weight: 5  },
		 *   { src: b, dst: c, weight: 10 },
		 * );
		 *
		 * // update edge ab
		 * graph.setEdge(
		 *   { src: a, dst: b, weight: 10 },
		 * );
		 * ```
		 * @param src The source vertex.
		 * @param dst The destination vertex.
		 * @param weight The weight assciated with the path from `src` to `dst`. Defaults to 0.
		 * @throws If `src` or `dst` is not in the graph.
		 * @throws If `weight` is negative or not a number.
		 */
		setEdge(...edgeDescs: Array<EdgeDescriptor<T>>): void;
		/**
		 * Get the edge that connects one vertex to another.
		 *
		 * ```typescript
		 * const edge = graph.edge(a, b);
		 * if (edge) {
		 *   console.log(`Found an edge from "${edge.src.id}" to "${edge.dst.id}" with weight ${edge.weight}`);
		 * }
		 * ```
		 * @param src The source vertex.
		 * @param dst The destination vertex.
		 * @returns If an edge from `src` to `dst` exists, returns the `Edge`. Otherwise, `undefined`.
		 */
		edge(src: Vertex<T>, dst: Vertex<T>): Edge<T> | undefined;
		/**
		 * Test if an edge from one vertex to another is present in the graph.
		 *
		 * ```typescript
		 * if (graph.hasEdge(a, b)) {
		 *   console.log('an edge from "a" to "b" was found');
		 * }
		 * ```
		 * @param src The source vertex.
		 * @param dst The destination vertex.
		 * @returns If an edge from `src` to `dst` exists, returns `true`. Otherwise, `false`.
		 */
		hasEdge(src: Vertex<T>, dst: Vertex<T>): boolean;
		/**
		 * Remove an edge or a set of edges from the graph.
		 *
		 * ```typescript
		 * graph.removeEdge(e1, e2);
		 * ```
		 * @param edges A variable number of edges to remove.
		 */
		removeEdge(...edges: Array<Edge<T>>): void;
		/**
		 * An iterable of all edges in the graph.
		 *
		 * ```typescript
		 * for (const edge of graph.edges) {
		 *   console.log(`edge: ${edge.src.id} -> ${edge.dst.id}`);
		 * }
		 * ```
		 */
		readonly edges: IterableIterator<Edge<T>>;
		/**
		 * The number of edges in the graph.
		 *
		 * ```typescript
		 * console.log(`the graph has ${graph.edgeCount} edges`);
		 * ```
		 */
		readonly edgeCount: number;
		/**
		 * Remove all vertices and edges from the graph.
		 * Also call an optional `onDispose` provided at construction.
		 *
		 * ```typescript
		 * graph.dispose();
		 * // graph.vertexCount === 0
		 * // graph.edgeCount === 0
		 * ```
		 */
		dispose(): void;
		/**
		 * Subscribe to vertex changes.
		 *
		 * After this graph's vertices have been updated using [[addVertex]] or [[removeVertex]],
		 * the `observer` attached will have its `onChanged` function called when [[commit]] is called.
		 *
		 * ```typescript
		 * graph.onVerticesChanged({
		 *   onChanged() {
		 *     console.log(`this graph's vertices have changed`);
		 *   }
		 * });
		 * ```
		 * @param observer
		 */
		onVerticesChanged(observer: IObserver<void>): ISubscription;
		/**
		 * Subscribe to edge changes.
		 *
		 * After this graph's edges have been updated using [[setEdge]] or [[removeEdge]],
		 * the `observer` attached will have its `onChanged` function called when [[commit]] is called.
		 *
		 * ```typescript
		 * graph.onEdgesChanged({
		 *   onChanged() {
		 *     console.log(`this graph's edges have changed`);
		 *   }
		 * });
		 * ```
		 * @param observer
		 */
		onEdgesChanged(observer: IObserver<void>): ISubscription;
		/**
		 * Trigger any attached observers if there were changes to this graph.
		 * If there are no changes to the graph, this is a no-op and no callbacks will be triggered.
		 *
		 * ```typescript
		 * graph.commit();
		 * ```
		 */
		commit(): void;
	}
	/**
	 * An adaptor for an observable collection to automatically generate and update a graph.
	 * Used in [[IDirectedGraph.watch]].
	 */
	interface ICollectionAdaptor<T> {
		/**
		 * A observable collection from the sdk, e.g. `mpSdk.Sweep.data`.
		 */
		collection: IObservableMap<T>;
		/**
		 * Determines whether or not an item from the collection should be considered a neighbor of another item.
		 * @param src A vertex containing the source item
		 * @param dst A vertex containing the destination item
		 */
		isNeighborOf(src: Vertex<T>, dst: Vertex<T>): boolean;
		/**
		 * Get a list of ids for other vertices that should be considered neighbors to an item in the collection.
		 * @param item
		 */
		neighborsOf(item: Vertex<T>): IterableIterator<string>;
		/**
		 * Get the weight between two items in the collection to use as the connecting edges weight.
		 * @param src
		 * @param dst
		 */
		weightBetween(src: Vertex<T>, dst: Vertex<T>): number;
		/**
		 * Determines whether or not an item from the collection will be added as a graph vertex.
		 * @param item
		 */
		shouldAdd?(item: T): boolean;
	}
	/**
	 * The status of an A* search.
	 */
	enum AStarStatus {
		/** A path was found. */
		SUCCESS = "astar.status.success",
		/** No path was found. */
		NO_PATH = "astar.status.no_path",
		/** A path wasn't found in the time specified. */
		TIMEOUT = "astar.status.timeout",
		/** The start vertex was not found in the graph. */
		NO_START_VERTEX = "astar.status.no_start",
		/** The end vertex was not found in the graph. */
		NO_END_VERTEX = "astar.status.no_end"
	}
	/**
	 * The result of doing an A* search.
	 */
	type AStarResult<T> = {
		/** Whether the search was successful, timed out, or if there was no path found. */
		status: AStarStatus;
		/** The total cost of tranversing the path. */
		cost: number;
		/** On success, contains the path of vertices. */
		path: Array<Vertex<T>>;
	};
	/**
	 * Options that can configure how the A* algorithm runs.
	 */
	interface SearchOptions<T> {
		/** An estimate of the "distance" between `vertexA` and `vertexB`. The default heuristic function returns 0. */
		heuristic(vertexA: Vertex<T>, vertexB: Vertex<T>, edge: Edge<T>): number;
	}
	/**
	 * An object that encapsulates a graph and can be used to execute A* or subscribe to A* for potential changes.
	 */
	interface IAStarRunner<T> {
		/**
		 * Do the A* search.
		 * @param timeout The amount of time to spend trying to find a path. Defaults to 5000ms.
		 * @returns {AStarResult<T>} The results of running A*.
		 *
		 * ```typescript
		 * const aStarRunner = mpSdk.Graph.createAStarRunner(...);
		 * const result = aStarRunner.exec();
		 * if (result.status === mpSdk.Graph.AStarStatus.SUCCESS) {
		 *   console.log('found a path of length', result.path.length);
		 * }
		 * ```
		 */
		exec(timeout?: number): AStarResult<T>;
		/**
		 * Subscribe to changes in the underlying graph and receive a callback in `observer` when changes are detected.
		 * @param observer
		 * @returns {ISubscription} A subscription to stop listening for changes to the graph.
		 *
		 * ```typescript
		 * const aStarRunner = mpSdk.Graph.createAStarRunner(...);
		 * const subscription = aStarRunner.subscribe({
		 *   onChanged(runner) {
		 *     const result = runner.exec();
		 *     if (result.status === mpSdk.Graph.AStarStatus.SUCCESS) {
		 *       console.log('found a path of length', result.path.length);
		 *     }
		 *   }
		 * });
		 * // ... some time later when the runner is no longer needed
		 * subscription.cancel();
		 * ```
		 */
		subscribe(observer: IObserver<Graph.IAStarRunner<T>> | ObserverCallback<Graph.IAStarRunner<T>>): ISubscription;
		/**
		 * Release resources associated with the runner.
		 * This function should be called once you are done with the runner.
		 */
		dispose(): void;
	}
}
export interface Graph {
	AStarStatus: typeof Graph.AStarStatus;
	/**
	 * Create an empty graph data structure.
	 *
	 * ```
	 * const graph = mpSdk.Graph.createDirectedGraph();
	 * ```
	 * @param onDispose An optional callback to be called when [[IDirectedGraph.dispose]] is called
	 * @template T The type of any user data associated with each vertex in the graph.
	 *
	 * @embed
	 * @bundle
	 * @introduced 3.1.55.2-34-ga9934ccd93
	 */
	createDirectedGraph<T>(onDispose?: () => void): Graph.IDirectedGraph<T>;
	/**
	 * Create a "runner" for the A* algorithm around a `graph`, and `start` and `end` vertices.
	 *
	 * The runner encapsulates the details of the graph and search, caches the results of A*,
	 * and provides a way to subscribe to potential changes in the path signifying that the results of [[Graph.AStarRunner.exec]] may have changed.
	 *
	 * ```typescript
	 * const graph = mpSdk.Graph.createDirectedGraph();
	 * // ... setup graph vertices and edges
	 * const start = graph.vertex('start');
	 * const end = graph.vertex('end');
	 * const aStarRunner = mpSdk.Graph.createAStarRunner(graph, start, end);
	 * const result = aStarRunner.exec();
	 * ```
	 *
	 * @param graph The graph to traverse
	 * @param start The start vertex.
	 * @param end The end vertex.
	 * @param options An optional `heuristic` function.
	 * @return {graph.AStarRunner} A runner for A* that can execute the search or be subscribed to.
	 *
	 * @embed
	 * @bundle
	 * @introduced 3.1.55.2-34-ga9934ccd93
	 */
	createAStarRunner<T>(graph: Graph.IDirectedGraph<T>, start: Graph.Vertex<T>, end: Graph.Vertex<T>, options?: Partial<Graph.SearchOptions<T>>): Graph.IAStarRunner<T>;
}
export declare namespace Label {
	type Label = {
		position: Vector3;
		sid: string;
		text: string;
		visible: boolean;
		/** @deprecated Use [[floorInfo]] instead */
		floor: number;
		floorInfo: {
			id: string;
			sequence: number;
		};
	};
	type LabelDeprecated = {
		position: Vector3;
		sid: string;
		text: string;
		visible: boolean;
		/** @deprecated Use [[floorInfo]] instead */
		floor: number;
		floorInfo: {
			id: string;
			sequence: number;
		};
		screenPosition: Vector2;
	};
	enum Event {
		/** @event */
		POSITION_UPDATED = "label.positionupdated"
	}
}
export interface Label {
	Event: typeof Label.Event;
	/**
	 * This function returns the data of all labels.
	 *
	 * @deprecated Use [[data]] observable instead.
	 */
	getData(): Promise<Label.LabelDeprecated[]>;
	/**
	 * An observable map of the current labels.
	 * Returns an object with a map of labels.
	 *
	 * ```
	 * mpSdk.Label.data.subscribe({
	 *  onAdded: function (index, item, collection) {
	 *    console.log('Label added to the collection', index, item, collection);
	 *  },
	 *  onRemoved: function (index, item, collection) {
	 *    console.log('Label removed from the collection', index, item, collection);
	 *  },
	 *  onUpdated: function (index, item, collection) {
	 *    console.log('Label updated in place in the collection', index, item, collection);
	 *  },
	 * });
	 * ```
	 *
	 * @embed
	 * @bundle
	 * @introduced 3.1.68.12-7-g858688944a
	 */
	data: IObservableMap<Label.Label>;
}
export declare namespace Link {
	/**
	 * The behavior to use when creating a link.
	 */
	enum CreationPolicy {
		/** Use Showcase's current window.location as the base of the link */
		WINDOW = "link.creationpolicy.window",
		/** Use the embedder's window.location as the base of the link */
		REFERRER = "link.creationpolicy.referrer",
		/** Use the original Matterport link as the base of the link */
		MATTERPORT = "link.creationpolicy.matterport"
	}
	/**
	 * The behavior to use when clicking a link
	 */
	enum OpenPolicy {
		/** Use the default behavior for the associated link type */
		DEFAULT = "link.openpolicy.default",
		/** Open a new tab or window */
		NEW_WINDOW = "link.openpolicy.newwindow",
		/** Open in the current iframe */
		SAME_FRAME = "link.openpolicy.sameframe",
		/** Navigate the window that is the current embedder of Showcase */
		CURRENT_WINDOW = "link.openpolicy.current"
	}
	enum DestinationPolicy {
		/** Navigate to the default destination for links; likely the Showcase embedder's domain */
		DEFAULT = "link.destination.default",
		/** Navigate directly to the Showcase of a Matterport space */
		MATTERPORT = "link.destination.matterport"
	}
	type CreateLinkOptions = {
		/** The list of URL parameters to include in the share link */
		includeParams: string[];
	};
	type OpenPolicyOptions = {
		/**
		 * An optional template for the link to use when the policy is not set to `SAME_FRAME`,
		 * that will have any `${[param]}` substrings interpolated using the current set of URL parameters.
		 *
		 * If `${[param]}` is included in the path of the URL, it will be replaced by the current URL parameter's value or undefined (`${m}/show`: `abc123/show`).
		 *
		 * If `${[param]}` is included in the search parameters of the URL, it and it's value wil be appended ot the URL (`${m}`: `m=abc123`).
		 *
		 * URL parameters that are unset will be appended without a value. (`${unset}`: `unset`)
		 *
		 * Note: `${m}` or `${model} are special cases in model links.
		 * Instead of the current window's "model" param, the model ID from the link will be used instead.
		 *
		 * As an example, the string `"https://my.domain.com/${m}/show.html?${play}&${unset}"` interpolated at the URL `https://my.domain.com/show/?m=abc123&play=1`
		 * will result in a URL like `"https://my.domain.com/abc123/show.html?play=1&unset&m=abc123"`.
		 */
		templateHref: string;
	};
}
export interface Link {
	CreationPolicy: typeof Link.CreationPolicy;
	OpenPolicy: typeof Link.OpenPolicy;
	/**
	 * Create a shareable link to the current Showcase player.
	 * ```typescript
	 * const link = await sdk.Link.createLink();
	 * ```
	 *
	 * @embed
	 * @bundle 3.1.60.12-32-g4572017c98
	 */
	createLink(): Promise<string>;
	/**
	 * Create a deep link to the current location of the current Showcase player.
	 * ```typescript
	 * const deepLink = await sdk.Link.createDeepLink();
	 * ```
	 *
	 * @embed
	 * @bundle 3.1.60.12-32-g4572017c98
	 */
	createDeepLink(): Promise<string>;
	/**
	 * Change how the link the share dialog and the [[createLink]] and [[createDeepLink]] links are created.
	 *
	 * ```typescript
	 * await sdk.Link.setShareLinkPolicy(sdk.Link.CreationPolicy.REFERRER);
	 * const link = await sdk.Link.createLink();
	 * console.log(link); // should log a link to your page that embeds Showcase
	 * ```
	 * @param policy
	 * @param options
	 *
	 * @embed
	 * @bundle 3.1.60.12-32-g4572017c98
	 */
	setShareLinkPolicy(policy: Link.CreationPolicy, options?: Partial<Link.CreateLinkOptions>): Promise<void>;
	/**
	 * Change the behavior of clicking a link to another model.
	 *
	 * ```typescript
	 * sdk.Link.setModelLinkPolicy(sdk.Link.OpenPolicy.NEW_WINDOW);
	 * // clicking a link to another model will now open a new window
	 * ```
	 *
	 * @param policy
	 * @param options
	 *
	 * @embed
	 * @bundle 3.1.60.12-32-g4572017c98
	 */
	setModelLinkPolicy(policy: Link.OpenPolicy, options?: Partial<Link.OpenPolicyOptions>): Promise<void>;
	setModelLinkPolicy(policy: Link.OpenPolicy, destination: Link.DestinationPolicy): Promise<void>;
	/**
	 * Change the behavior of clicking a link to a location within the current model.
	 *
	 * ```typescript
	 * // when clicking a link with a location within the current model, open a new window with the model at the location
	 * // instead of navigating the current model to the new location
	 * sdk.Link.setNavigationLinkPolicy(sdk.Link.OpenPolicy.NEW_WINDOW, {
	 *   templateHref: 'https://example.com/${m}/show.html?',
	 * });
	 *
	 * // revert the navigation link behavior to the default
	 * sdk.Link.setNavigationLinkPolicy(sdk.Link.OpenPolicy.DEFAULT);
	 * ```
	 *
	 * @param policy
	 * @param options`
	 *
	 * @embed
	 * @bundle 3.1.60.12-32-g4572017c98
	 */
	setNavigationLinkPolicy(policy: Link.OpenPolicy, options?: Partial<Link.OpenPolicyOptions>): Promise<void>;
	/**
	 * Change the behavior of clicking a link to a page from the same origin as the one hosting Showcase.
	 *
	 * ```typescript
	 * sdk.Link.setSameOriginLinkPolicy(sdk.Link.OpenPolicy.CURRENT_WINDOW);
	 * // clicking a link with the same origin as Showcase's embedder will now navigate the embedding page
	 *
	 * sdk.Link.setSameOriginLinkPolicy(sdk.Link.OpenPolicy.SAME_FRAME);
	 * // clicking a link with the same origin as Showcase's embedder will now navigate Showcase's iframe to that page
	 * ```
	 *
	 * @param policy
	 *
	 * @embed
	 * @bundle 3.1.60.12-32-g4572017c98
	 */
	setSameOriginLinkPolicy(policy: Link.OpenPolicy): Promise<void>;
	/**
	 * Change the behavior of clicking a link to a different origin.
	 *
	 * ```typescript
	 * sdk.Link.setExternalLinkPolicy(false);
	 * // clicking an external link will now navigate the current page (not the Showcase iframe) to the link
	 *
	 * ```
	 *
	 * @param openInNewWindow Open the link in a new tab or window; otherwise, replace the embedder's window.
	 * true is the default behavior.
	 *
	 * @embed
	 * @bundle 3.1.60.12-32-g4572017c98
	 */
	setExternalLinkPolicy(openInNewWindow: boolean): Promise<void>;
}
export declare namespace Mattertag {
	type MattertagData = {
		sid: string;
		enabled: boolean;
		/** The world space position of the mattertag anchor within the model */
		anchorPosition: Vector3;
		/** The world space (non-normal) direction of the mattertag's stem */
		stemVector: Vector3;
		stemVisible: boolean;
		label: string;
		description: string;
		/** @deprecated */
		parsedDescription: DescriptionChunk[];
		media: {
			type: MediaType;
			src: string;
		};
		color: Color;
		/** @deprecated Use [[floorInfo]] instead */
		floorId: number;
		/** @deprecated Use [[floorInfo]] instead */
		floorIndex: number;
		floorInfo: {
			id: string;
			sequence: number;
		};
		/** @deprecated Use [[media.type]] instead */
		mediaType: MediaType;
		/** @deprecated Use [[media.src]] instead */
		mediaSrc: string;
		/** @deprecated Use [[stemVector]] instead */
		anchorNormal: Vector3;
		/** @deprecated Calculate the length of [[stemVector]] instead */
		stemHeight: number;
	};
	type ObservableMattertagData = {
		sid: string;
		enabled: boolean;
		/** The world space position of the mattertag anchor within the model */
		anchorPosition: Vector3;
		/** The world space (non-normal) direction of the mattertag's stem */
		stemVector: Vector3;
		stemVisible: boolean;
		label: string;
		description: string;
		media: {
			type: MediaType;
			src: string;
		};
		color: Color;
		/** @deprecated Use [[floorInfo]] instead */
		floorIndex: number;
		floorInfo: {
			id: string;
			sequence: number;
		};
	};
	enum Transition {
		INSTANT = "transition.instant",
		FLY = "transition.fly",
		FADEOUT = "transition.fade"
	}
	interface DescriptionChunk {
		text?: string;
		link?: Link;
		type: DescriptionChunkType;
	}
	interface Link {
		label: string;
		url: string;
		type: LinkType;
		navigationData?: any;
	}
	/**
	 * Options that can be specified when injection custom HTML into a Mattertag.
	 */
	type InjectionOptions = {
		/** The size of the frame to create */
		size?: Size;
		/**
		 * @deprecated This option is no longer required and will be ignored
		 */
		windowPath?: string;
		/**
		 * A map for the global functions and variables we provide in your iframe sandbox.
		 * Only needs to be used if scripts you are importing also have a global `send`, `on`, `off`, or `tag`.
		 */
		globalVariableMap?: GlobalVariableMap;
	};
	/**
	 * Map the globals we provide in your sandbox to other names.
	 */
	type GlobalVariableMap = {
		send?: string;
		on?: string;
		off?: string;
		tag?: string;
	};
	/**
	 * A messaging object to send and receive messages to and from your iframe sandbox.
	 */
	interface IMessenger {
		/**
		 * Send a messages of type `eventType` to the iframe sandbox with any optional data associated with the message
		 */
		send(eventType: string, ...args: any[]): void;
		/**
		 * Add a handler for messages of type `eventType` from the iframe sandbox
		 */
		on(eventType: string, eventHandler: (...args: any[]) => void): void;
		/**
		 * Remove a handler for messages of type `eventType` from the iframe sandbox
		 */
		off(eventType: string, eventHandler: (...args: any[]) => void): void;
	}
	type PreventableActions = {
		opening: boolean;
		navigating: boolean;
	};
	enum LinkType {
		/** A link to another position in the current model */
		NAVIGATION = "tag.link.nav",
		/** A link to a different Matterport model */
		MODEL = "tag.link.model",
		/** An external link */
		EXT_LINK = "tag.link.ext"
	}
	enum DescriptionChunkType {
		NONE = "tag.chunk.none",
		TEXT = "tag.chunk.text",
		LINK = "tag.chunk.link"
	}
	enum Event {
		/** @event */
		HOVER = "tag.hover",
		/** @event */
		CLICK = "tag.click",
		/** @event */
		LINK_OPEN = "tag.linkopen"
	}
	enum MediaType {
		NONE = "mattertag.media.none",
		PHOTO = "mattertag.media.photo",
		VIDEO = "mattertag.media.video",
		RICH = "mattertag.media.rich"
	}
	/**
	 * A subset of the MattertagData used to add Mattertags through the sdk.
	 * Most properties are optional except those used for positioning: `anchorPosition`, `stemVector`.
	 */
	interface MattertagDescriptor {
		anchorPosition: Vector3;
		stemVector: Vector3;
		stemVisible?: boolean;
		label?: string;
		description?: string;
		media?: {
			type: MediaType;
			src: string;
		};
		color?: Color;
		/** @deprecated Use [[floorIndex]] instead */
		floorId?: number;
		floorIndex?: number;
		iconId?: string;
	}
	type EditableProperties = {
		label: string;
		description: string;
		media: {
			type: MediaType;
			src: string;
		};
	};
	interface PositionOptions {
		anchorPosition: Vector3;
		stemVector: Vector3;
		/** @deprecated Use [[floorIndex]] instead */
		floorId: number;
		floorIndex: number;
	}
}
export interface Mattertag {
	Transition: typeof Mattertag.Transition;
	LinkType: typeof Mattertag.LinkType;
	DescriptionChunkType: typeof Mattertag.DescriptionChunkType;
	Event: typeof Mattertag.Event;
	MediaType: typeof Mattertag.MediaType;
	/**
	 * This function returns metadata on the collection of Mattertags.
	 *
	 * @deprecated Use [[Tag.data]] instead
	 */
	getData(): Promise<Mattertag.MattertagData[]>;
	/**
	 * An observable collection of Mattertag data that can be subscribed to.
	 *
	 * @deprecated Use [[Tag.data]] instead
	 */
	data: IObservableMap<Mattertag.ObservableMattertagData>;
	/**
	 * This function navigates to the Mattertag disc with the provided sid, opening the billboard on arrival.
	 *
	 * ```
	 * mpSdk.Mattertag.navigateToTag(sid, mpSdk.Mattertag.Transition.FLY);
	 * ```
	 *
	 * @param tagSid The sid of the Mattertag to navigate to
	 * @param transition The type of transition to navigate to a sweep where the Mattertag disc is visible
	 * @param force If navigating to the tag is disabled, passing force === true will force the transition to occur
	 */
	navigateToTag(tagSid: string, transition: Mattertag.Transition, force?: boolean): Promise<string>;
	/**
	  * Get the disc's (3d) position of a Mattertag.
	  *
	  * @deprecated Disc position is automatially included in [[Tag.data]]
	  */
	getDiscPosition(tag: Mattertag.MattertagData | Mattertag.ObservableMattertagData, result?: Vector3): Vector3;
	/**
	 * Add one or more Mattertags to Showcase.
	 * Each input Mattertag supports setting the label, description, color, anchorPosition, and stemVector.
	 *
	 * Two properties are required:
	 * - `anchorPosition`, the point where the tag connects to the model
	 * - `stemVector`, the direction, aka normal, and height that the Mattertag stem points
	 *
	 * See [[Pointer.intersection]] for a way to retrive a new `anchorPosition` and `stemVector`.
	 *
	 * **Note**: these changes are not persisted between refreshes of Showcase. They are only valid for the current browser session.
	 *
	 * @param newTagData A single or array of Mattertag templates to add.
	 * @return A promise that resolves with the sids for the newly added Mattertags.
	 *
	 * @deprecated Use [[Tag.add]] instead
	 */
	add(newTagData: Mattertag.MattertagDescriptor | Mattertag.MattertagDescriptor[]): Promise<string[]>;
	/**
	 * Edit the data in a Mattertag billboard.
	 *
	 * **Note**: these changes are not persisted between refreshes of Showcase. They are only valid for the current browser session.
	 *
	 * @param tagSid the sid of the Mattertag to edit
	 * @param properties A dictionary of properties to set
	 *
	 * @deprecated Use [[Tag.editBillboard]] or [[Tag.registerAttachment]] and/or [[Tag.attach]] to manage media
	 */
	editBillboard(tagSid: string, properties: Partial<Mattertag.EditableProperties>): Promise<void>;
	/**
	 * Move and reorient a Mattertag.
	 *
	 * See [[Pointer.intersection]] for a way to retrieve a new `anchorPosition` and `stemVector`.
	 *
	 * **Note**: these changes are not persisted between refreshes of Showcase. They are only valid for the current browser session.
	 *
	 * @param tagSid The sid of the Mattertag to reposition
	 * @param moveOptions The new anchorPosition, stemVector and/or floorId.
	 *
	 * @deprecated Use [[Tag.editPosition]] instead
	 */
	editPosition(tagSid: string, moveOptions: Partial<Mattertag.PositionOptions>): Promise<void>;
	/**
	 * Edit the color of a Mattertag
	 *
	 * @param tagSid The sid of the Mattertag to edit
	 * @param color The new color to be applied to the Mattertag disc
	 *
	 * @deprecated Use [[Tag.editColor]] instead
	 */
	editColor(tagSid: string, color: Color): Promise<void>;
	/**
	 * Edit the opacity of a Mattertag
	 *
	 * @param tagSid The sid of the Mattertag to edit
	 * @param opacity The target opacity for the Mattertag in the range of [0, 1]
	 *
	 * @deprecated Use [[Tag.editOpacity]] instead
	 */
	editOpacity(tagSid: string, opacity: number): Promise<void>;
	/**
	 * Edit the stem of a Mattertag
	 *
	 * @param tagSid The sid of the Mattertag to edit
	 * @param stemOptions What to change about the Mattertag's stem - can include stemHeight and stemVisible
	 * @introduced 3.1.70.10-0-ge9cb83b28c
	 *
	 * @deprecated Use [[Tag.editStem]] instead
	 */
	editStem(tagSid: string, options: {
		stemHeight?: number;
		stemVisible?: boolean;
	}): Promise<void>;
	/**
	 * Register an icon to use with subsequent [[Mattertag.editIcon]] calls.
	 *
	 * **Note**: It is recommended to host your own images to mitigate cross origin limitations.
	 *
	 * @param iconId A user specified string to use as a lookup of this icon
	 * @param iconSrc The src of the icon, like the src of an \<img>
	 *
	 * @deprecated Use [[Asset.registerTexture]] instead
	 */
	registerIcon(iconId: string, iconSrc: string): Promise<void>;
	/**
	 * Change the icon of the Mattertag disc
	 *
	 * **Note**: these changes are not persisted between refreshes of Showcase. They are only valid for the current browser session.
	 *
	 *
	 * @param tagSid The sid of the Mattertag to edit
	 * @param iconId The id of the icon to apply
	 *
	 * **Errors**
	 *
	 * Warns if the provided `iconSrc` is an .svg file which doesn't have a `'width'` or `'height'` attribute.
	 * Defaults to a resolution of 128x128 if neither exist.
	 *
	 * @deprecated Use [[Tag.editIcon]] instead
	 */
	editIcon(tagSid: string, iconId: string): Promise<void>;
	/**
	 * Resets the icon of the Mattertag disc back to its original icon.
	 *
	 * @param tagSid The sid of the Mattertag to reset
	 *
	 * @deprecated Use [[Tag.resetIcon]] instead
	 */
	resetIcon(tagSid: string): Promise<void>;
	/**
	 * Removes one or more Mattertags from Showcase.
	 *
	 * **Note**: these changes are not persisted between refreshes of Showcase. They are only valid for the current browser session.
	 *
	 * @param tagSids A single Mattertag sid or array of Mattertag sids to remove.
	 * @return A promise with an array of Mattertag sids that were actually removed.
	 *
	 * @deprecated Use [[Tag.remove]] instead
	 */
	remove(tagSids: string | string[]): Promise<string[]>;
	/**
	 * Prevents the "default" Showcase action on a Mattertag from occurring: hover to open billboard, click to navigate to view.
	 *
	 * @param tagSid The sid of the Mattertag to remove actions from
	 * @param actions The set of actions to prevent
	 *
	 * @deprecated Use [[Tag.allowAction]] instead
	 */
	preventAction(tagSid: string, actions: Partial<Mattertag.PreventableActions>): Promise<void>;
	/**
	 * Add a custom frame that can host custom HTML and JavaScript, and communicate bi-directionally with your page.
	 *
	 * The frame that contains your custom code will have certain limitations due to being sandboxed by the `sandbox='allow-scripts` attribute.
	 * Attempting to access properties of other windows will also be blocked by the browser.
	 * ([see the MDN pages about iframe sandbox](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe))
	 *
	 * Currently, the HTML CAN ONLY BE SET ONCE by a call to `injectHTML`. This includes removing or clearing the HTML.
	 *
	 * @deprecated Use [[Tag.registerSandbox]] and [[Tag.attach]] instead
	 */
	injectHTML(tagSid: string, html: string, options: Mattertag.InjectionOptions): Promise<Mattertag.IMessenger>;
}
export declare namespace Measurements {
	type MeasurementData = {
		sid: string;
		label: string;
		floor: number;
		start: Vector3;
		end: Vector3;
	};
	/**
	 * The data associated with Showcase's measurement mode
	 */
	type MeasurementModeData = {
		/** A unique identifier for this measurement */
		sid: string;
		/** The list of wold-space coordinates that compose this measurement */
		points: Vector3[];
		/** The total length of the measurement */
		totalLength: number;
		/** The length of each segment between consecutive pairs of points */
		segmentLengths: number[];
		/** The user-set "description" of this measurement */
		label: string;
	};
	type State = {
		active: boolean;
	};
}
export interface Measurements {
	/**
	 * This function returns metadata on the collection of Measurements.
	 *
	 * ```
	 * mpSdk.Measurement.getData()
	 *   .then(function(Measurements) {
	 *     // Measurement data retreival complete.
	 *     if(Measurements.length > 0) {
	 *       console.log('First Measurement label: ' + Measurements[0].label);
	 *       console.log('First Measurement description: ' + Measurements[0].description);
	 *     }
	 *   })
	 *   .catch(function(error) {
	 *     // Measurement data retrieval error.
	 *   });
	 * ```
	 */
	getData(): Promise<Measurements.MeasurementData[]>;
	/**
	 * An observable collection of measurement mode data that can be subscribed to.
	 *
	 * ```
	 * mpSdk.Measurements.data.subscribe({
	 *   onAdded: function (index, item, collection) {
	 *     console.log('item added to the collection', index, item, collection);
	 *   },
	 *   onRemoved: function (index, item, collection) {
	 *     console.log('item removed from the collection', index, item, collection);
	 *   },
	 *   onUpdated: function (index, item, collection) {
	 *     console.log('item updated in place in the collection', index, item, collection);
	 *   },
	 *   onCollectionUpdated: function (collection) {
	 *     console.log('the entire up-to-date collection', collection);
	 *   }
	 * });
	 * ```
	 */
	data: IObservableMap<Measurements.MeasurementModeData>;
	/**
	 * Activate or deactivate measurement mode. This function can only be used after the application has started playing.
	 * Use [[App.state]] to determine the phase of the application.
	 *
	 * ```
	 * mpSdk.Measurements.toggleMode(true)
	 *   .then(() => {
	 *     console.log('measurement mode is now active');
	 *   });
	 * ```
	 */
	toggleMode(activate: boolean): Promise<void>;
	/**
	   * An observable measurement mode state object.
	   *
	   * ```
	   * mpSdk.Measurements.mode.subscribe(function (measurementModeState) {
	   *  // measurement mode state has changed
	   *  console.log('Is measurement mode currently active? ', measurementModeState.active);
	   * });
	   *
	   * // output
	   * // > Is measurement mode currently active? true
	   * ```
	   */
	mode: IObservable<Measurements.State>;
}
export declare namespace Sweep {
	type SweepData = {
		/** @deprecated Use [[sid]] instead */
		uuid: string;
		sid: string;
		alignmentType: Alignment;
		placementType: Placement;
		neighbors: string[];
		position: Vector3;
		rotation: Vector3;
		floor: number;
	};
	type ObservableSweepData = {
		/** @deprecated Use [[id]] instead */
		uuid: string;
		/** @deprecated Use [[id]] instead */
		sid: string;
		id: string;
		enabled: boolean;
		alignmentType: Alignment;
		placementType: Placement;
		neighbors: string[];
		position: Vector3;
		rotation: Vector3;
		floorInfo: SweepFloorInfo | EmptySweepFloorInfo;
	};
	type SweepFloorInfo = {
		id: string;
		sequence: number;
	};
	type EmptySweepFloorInfo = {
		id: undefined;
		sequence: undefined;
	};
	/**
	 * `rotation.x`: is the amount the camera will rotate up/down, in the range between [-90…90]
	 * with -90 being straight down and 90 being straight up, 45 would be looking up at a 45 degree angle., -45 down etc..
	 * `rotation.y`: is the amount the camera rotate around horizontally, between [-360…0…360],
	 * negative values to rotate to the left, positive to rotate to the right.
	 *
	 * Note: The rotation that Sweep.moveTo uses for input is the same rotation that will get returned from the [[Camera.pose]] property.
	 *
	 * ```
	 * const cachedPose = null;
	 * mpSdk.Camera.pose.subscribe(function (pose) {
	 *   cachedPose = pose;
	 * })
	 *
	 * // If the pose is returned immediately.
	 * console.log(cachedPose.rotation);
	 * ```
	 */
	type MoveToOptions = {
		rotation?: Rotation;
		transition?: Transition;
		/**
		 * Total transition time in milliseconds.
		 */
		transitionTime?: number;
	};
	enum Event {
		/**
		 * @event
		 */
		ENTER = "sweep.enter",
		EXIT = "sweep.exit"
	}
	enum Transition {
		INSTANT = "transition.instant",
		FLY = "transition.fly",
		FADEOUT = "transition.fade"
	}
	enum Alignment {
		ALIGNED = "aligned",
		UNALIGNED = "unaligned"
	}
	enum Placement {
		UNPLACED = "unplaced",
		AUTO = "auto",
		MANUAL = "manual"
	}
	namespace Conversion {
		/**
		 * Generate a map between v2 IDs and v1 IDs
		 *
		 * This method will help with migration between IDs used for sweeps.
		 *
		 * ```
		 * const mapping = await mpSdk.Sweep.Conversion.createIdMap();
		 * ```
		 *
		 * @param invert?: boolean - if passed, return map of v1->v2 instead
		 */
		function createIdMap(invert?: boolean): Promise<Dictionary<string>>;
		/**
		 * Return the label associated with the provided sweep ID
		 *
		 * The label is what's displayed for the sweep in the workshop
		 *
		 * ```
		 * const label = mpSdk.Sweep.Conversion.getLabelFromId('abcdefghijklmno0123456789');
		 * ```
		 *
		 * @param id
		 */
		function getLabelFromId(id: string): Promise<string>;
	}
}
export interface Sweep {
	Event: typeof Sweep.Event;
	Transition: typeof Sweep.Transition;
	Alignment: typeof Sweep.Alignment;
	Placement: typeof Sweep.Placement;
	Conversion: typeof Sweep.Conversion;
	/**
	 * An observable collection of sweep data that can be subscribed to.
	 *
	 * When first subscribing, the current set of Sweeps will call the observer's `onAdded` for each Sweep as the data becomes available.
	*
	 * ```
	 * mpSdk.Sweep.data.subscribe({
	 *   onAdded: function (index, item, collection) {
	 *     console.log('sweep added to the collection', index, item, collection);
	 *   },
	 *   onRemoved: function (index, item, collection) {
	 *     console.log('sweep removed from the collection', index, item, collection);
	 *   },
	 *   onUpdated: function (index, item, collection) {
	 *     console.log('sweep updated in place in the collection', index, item, collection);
	 *   },
	 *   onCollectionUpdated: function (collection) {
	 *     console.log('the entire up-to-date collection', collection);
	 *   }
	 * });
	 * ```
	 */
	data: IObservableMap<Sweep.ObservableSweepData>;
	/**
	 * A graph of enabled sweeps that can be used for pathfinding.
	 * This graph will automatically update as sweeps change and trigger any observers.
	 * The weight of each edge is the Euclidean distance from a sweep to its neighbor.
	 *
	 * Enabling a sweep will automatically add it and its edges to the graph.<br>
	 * Disabling a sweep will automatically remove it and its edges from the graph.
	 *
	 * ```typescript
	 * const sweepGraph = await mpSdk.Sweep.createGraph();
	 * const startSweep = sweepGraph.vertex('[start vertex]');
	 * const endSweep = sweepGraph.vertex('[end vertex]');
	 *
	 * const path = mpSdk.Graph.createAStarRunner(sweepGraph, startSweep, endSweep).exec();
	 * ```
	 */
	createGraph(): Promise<Graph.IDirectedGraph<Sweep.ObservableSweepData>>;
	/**
	 * An observable for the player's current sweep.
	 *
	 * If the camera is transitioning to or is currently in Dollhouse or Floorplan mode, or if the camera is transitioning between sweeps,
	 * the `currentSweep` argument in the registered callback will be a "default" sweep that has an empty `sid` property.
	 *
	 * If the sweep is an unaligned, unplaced 360º view, `currentSweep.floorInfo.id` and `currentSweep.floorInfo.sequence` will both be `undefined`.
	 *
	 * Use this table with the results of `sid`, `floorInfo.sequence`, and `floorInfo.id` to determine the current of the three possible states.
	 *
	 * |                    | at sweep                | transitioning | in unplaced  360º view |
	 * |--------------------|-------------------------|---------------|------------------------|
	 * | sid                | `${current.sid}`        | ''            | `${current.sid}`       |
	 * | floorInfo.sequence | `${floorInfo.sequence}` | undefined     | undefined              |
	 * | floorInfo.id       | `${floorInfo.id}`       | undefined     | undefined              |
	 *
	 * ```
	 * mpSdk.Sweep.current.subscribe(function (currentSweep) {
	 *   // Change to the current sweep has occurred.
	 *   if (currentSweep.sid === '') {
	 *     console.log('Not currently stationed at a sweep position');
	 *   } else {
	 *     console.log('Currently at sweep', currentSweep.sid);
	 *     console.log('Current position', currentSweep.position);
	 *     console.log('On floor', currentSweep.floorInfo.sequence);
	 *   }
	 * });
	 * ```
	 *
	 * You can also use this observable to wait until the user is in a sweep before executing additional code:
	 *
	 * ```typescript
	 * await mpSdk.Sweep.current.waitUntil((currentSweep) => currentSweep.id !== '');
	 * ```
	 */
	current: IObservable<Sweep.ObservableSweepData>;
	/**
	 * Move to a sweep.
	 *
	 *```
	 * const sweepId = '1';
	 * const rotation = { x: 30, y: -45 };
	 * const transition = mpSdk.Sweep.Transition.INSTANT;
	 * const transitionTime = 2000; // in milliseconds
	 *
	 * mpSdk.Sweep.moveTo(sweepId, {
	 *     rotation: rotation,
	 *     transition: transition,
	 *     transitionTime: transitionTime,
	 *   })
	 *   .then(function(sweepId){
	 *     // Move successful.
	 *     console.log('Arrived at sweep ' + sweepId);
	 *   })
	 *   .catch(function(error){
	 *     // Error with moveTo command
	 *   });
	 * ```
	 *
	 * @param The destination sweep.
	 * @param Options.
	 * @returns A promise that will return the destination sweep.
	 */
	moveTo(sweep: string, options: Sweep.MoveToOptions): Promise<string>;
	/**
	 * Enable a set of sweeps by ids.
	 *
	 * Enabling a sweep will show the sweep's puck and allow the player to navigate to that location.
	 *
	 * ```
	 * mpSdk.Sweep.enable('sweep1', 'sweep2', 'sweep3');
	 * ```
	 *
	 * @param sweepIds
	 */
	enable(...sweepIds: string[]): Promise<void>;
	/**
	 * Disable a set of sweeps by ids.
	 *
	 * Disabling a sweep will hide the sweep's puck and prevent the player's ability to navigate to that location.
	 *
	 *
	 * ```
	 * mpSdk.Sweep.disable('sweep1', 'sweep2', 'sweep3');
	 * ```
	 *
	 * @param sweepIds
	 */
	disable(...sweepIds: string[]): Promise<void>;
	/**
	 * Add specified sweep IDs to the neighbors array
	 *
	 * This method allows changing the sweep connectivitiy to enable navigation from `sweepId`
	 * to all sweeps in the `toAdd` array. Note that we use V2 IDs for all arguments. Refer
	 * to Conversion.createIdMap() if you need to convert from the legacy V1 IDs.
	 *
	 * ```
	 * Sweep.addNeighbors("hn7etcuyffbmqkyp5e43axa0b", ["zr7ns1smp51zibx4s239di7wb"]);
	 * ```
	 *
	 * @param sweepId: string - Sweep ID
	 * @param toAdd: string[] - List of Sweep IDs to connect
	 * @returns A promise to a list of all current neighbor IDs (v2)
	 */
	addNeighbors(sweepId: string, toAdd: string[]): Promise<string[]>;
	/**
	 * Remove specified sweep IDs from the neighbors array
	 *
	 * This method allows changing the sweep connectivitiy to prevent navigation from `sweepId`
	 * to all sweeps in the `toRemove` array. Note that we use V2 IDs for all arguments. Refer
	 * to Conversion.createIdMap() if you need to convert from the legacy V1 IDs.
	 *
	 * ```
	 * Sweep.removeNeighbors("hn7etcuyffbmqkyp5e43axa0b", ["zr7ns1smp51zibx4s239di7wb"]);
	 * ```
	 *
	 * @param sweepId: string - Sweep ID
	 * @param toRemove: string[] - List of Sweep IDs to disconnect
	 * @returns A promise to a list of all current neighbor IDs (v2)
	 */
	removeNeighbors(sweepId: string, toRemove: string[]): Promise<string[]>;
}
export declare namespace Model {
	type ModelData = {
		sid: string;
		/** @deprecated Use [[Sweep.data]] instead */
		sweeps: Sweep.SweepData[];
		modelSupportsVr: boolean;
	};
	type ModelDetails = {
		sid: string;
		name?: string;
		presentedBy?: string;
		description?: string;
		summary?: string;
		address?: string;
		formattedAddress?: string;
		contactEmail?: string;
		contactName?: string;
		phone?: string;
		formattedContactPhone?: string;
		shareUrl?: string;
	};
	enum Event {
		/** @event */
		MODEL_LOADED = "model.loaded"
	}
}
export interface Model {
	Event: typeof Model.Event;
	/**
	 * This function returns basic model information.
	 *
	 * This is no longer the canonical way to receive sweep information. See [[Sweep.data]].
	 *
	 * ```
	 * mpSdk.Model.getData()
	 *   .then(function(model) {
	 *     // Model data retreival complete.
	 *     console.log('Model sid:' + model.sid);
	 *   })
	 *   .catch(function(error) {
	 *     // Model data retrieval error.
	 *   });
	 * ```
	 */
	getData(): Promise<Model.ModelData>;
	/**
	 * This function returns model details.
	 *
	 * ```
	 * mpSdk.Model.getDetails()
	 *   .then(function(modelDetails) {
	 *     // Model details retreival complete.
	 *     console.log('Model sid:' + modelDetails.sid);
	 *     console.log('Model name:' + modelDetails.name);
	 *     console.log('Model summary:' + modelDetails.summary);
	 *     console.log('Model description:' + modelDetails.description);
	 *   })
	 *   .catch(function(error) {
	 *     // Model details retrieval error.
	 *   });
	 * ```
	 */
	getDetails(): Promise<Model.ModelDetails>;
}
export declare namespace OAuth {
	/**
	 * An observer for events from a [[ITokenRefresher]]
	 */
	interface IRefreshObserver {
		/** Observe successful token refresh events */
		onRefresh?(): void;
		/** Observe failures during token refresh */
		onError?(e: Error): void;
	}
	/**
	 * The token and expiry received from a call to the API
	 */
	interface TokenInfo {
		access_token: string;
		expires_in: number;
	}
	/**
	 * A helper to tell the [[ITokenRefresher]] how to `fetch` a new token
	 */
	interface ITokenFetcher {
		/** Fetch the new token. */
		fetch(oldToken: string): Promise<TokenInfo>;
	}
	/**
	 * A helper to automatically refresh tokens
	 */
	interface ITokenRefresher {
		/**
		 * Shut down, stop refreshing, and clean up resources
		 */
		dispose(): void;
		/**
		 * Listen for successful refreshes of the token
		 * @param event The `'refresh'` event type
		 * @param callback The callback to call on a refresh
		 */
		on(event: "refresh", callback: () => void): ISubscription;
		/**
		 * Listen for errors when refreshing the token
		 * @param event The `'error'` event type
		 * @param callback The callback to call on error
		 */
		on(event: "error", callback: (e: Error) => void): ISubscription;
		/**
		 * Attach an observer that can listen for refresh or error events
		 * @param refreshObserver
		 */
		on(refreshObserver: OAuth.IRefreshObserver): ISubscription;
	}
}
export interface OAuth {
	/**
	 * The [[ITokenRefresher]] constructor
	 * ```
	 */
	createTokenRefresher(token: OAuth.TokenInfo, tokenFetcher: OAuth.ITokenFetcher): OAuth.ITokenRefresher;
}
export declare namespace Pointer {
	export type Intersection = {
		position: Vector3;
		normal: Vector3;
		/** @deprecated Use [[floorIndex]] instead */
		floorId: number | undefined;
		/**
		 * floorIndex is only defined when the intersected object is MODEL.
		 */
		floorIndex: number | undefined;
		object: Colliders;
	};
	export enum Colliders {
		NONE = "intersectedobject.none",
		MODEL = "intersectedobject.model",
		TAG = "intersectedobject.tag",
		SWEEP = "intersectedobject.sweep",
		UNKNOWN = "intersectedobject.unknown"
	}
	type FadeOutProps = {
		/**
		 * Duration in milliseconds. Default is 700.
		 */
		duration?: number;
		/**
		 * Delay in milliseconds. Default is 700.
		 */
		delay?: number;
	};
	type FadeInProps = {
		/**
		 * Duration in milliseconds. Default is 300.
		 */
		duration?: number;
	};
	/**
	 * Pointer reticle fade properties.
	 */
	export type FadeProps = {
		fadeOut?: FadeOutProps;
		fadeIn?: FadeInProps;
	};
	export {};
}
export interface Pointer {
	Colliders: typeof Pointer.Colliders;
	/**
	 * An observable intersection data object that can be subscribed to.
	 *
	 * ```
	 * mpSdk.Pointer.intersection.subscribe(function (intersectionData) {
	 *  // Changes to the intersection data have occurred.
	 *  console.log('Intersection position:', intersectionData.position);
	 *  console.log('Intersection normal:', intersectionData.normal);
	 * });
	 * ```
	 */
	intersection: IObservable<Pointer.Intersection>;
	/**
	 * @introduced 3.1.55.2-34-ga9934ccd93
	 * @deprecated Use [[Asset.registerTexture]] to register new textures instead.
	 */
	registerTexture(textureId: string, textureSrc: string): Promise<void>;
	/**
	 * Change the texture of the pointer reticle.
	 *
	 * ```typescript
	 * await mpSdk.Asset.registerTexture('customTextureId', 'https://[link.to/image]');
	 *
	 * // change the texture of the pointer reticle using a previously registered id.
	 * await mpSdk.Pointer.editTexture('customTextureId');
	 * ```
	 *
	 * @param textureId The id of the texture to apply.
	 *
	 * @embed
	 * @bundle
	 * @introduced 3.1.55.2-34-ga9934ccd93
	 */
	editTexture(textureId: string): Promise<void>;
	/**
	 * Resets the pointer reticle texture to the original texture.
	 * ```typescript
	 * await mpSdk.Pointer.resetTexture();
	 * ```
	 *
	 * @embed
	 * @bundle
	 * @introduced 3.1.55.2-34-ga9934ccd93
	 */
	resetTexture(): Promise<void>;
	/**
	 * Customizes the fade in/out behavior of the pointer reticle.
	 * @param props face properties
	 *
	 * @embed
	 * @bundle
	 * @introduced 3.1.55.2-34-ga9934ccd93
	 */
	setFadeProps(props: Pointer.FadeProps): Promise<void>;
	/**
	 * This function controls the visibility of the pointer reticle.
	 * @param visible pointer reticle visibility
	 *
	 * @embed
	 * @bundle
	 * @introduced 3.1.55.2-34-ga9934ccd93
	 */
	setVisible(visible: boolean): Promise<void>;
}
export declare namespace Renderer {
	type Resolution = {
		width: number;
		height: number;
	};
	type Visibility = {
		measurements: boolean;
		mattertags: boolean;
		sweeps: boolean;
		views: boolean;
	};
	type WorldPositionData = {
		position: Vector3 | null;
		/** @deprecated Use [[floorInfo]] */
		floor: number;
		floorInfo: {
			id: string;
			sequence: number;
		};
	};
}
export interface Renderer {
	/**
	 * Takes a screenshot (JPEG) of the user’s current view.
	 *
	 * ```
	 * const resolution = {
	 *   width: 600,
	 *   height: 800
	 * };
	 *
	 * const visibility = {
	 *   mattertags: false,
	 *   sweeps: true
	 * };
	 *
	 * mpSdk.Renderer.takeScreenShot(resolution, visibility)
	 *   .then(function (screenShotUri) {
	 *     // set src of an img element
	 *     img.src = screenShotUri
	 * });
	 * ```
	 *
	 * @param resolution The desired resolution for the screenshot.
	 * For example: `{width: 1920, height: 1080}`
	 * If no resolution is specified, then the resolution of the size of
	 * Showcase (the current window or the iframe embed) is used. Maximum 4096 x 4096.
	 * @param visibility Toggles certain scene objects such as Mattertag Posts and sweep markers.
	 * If no visibility object is specified, then all scene objects are hidden.
	 * @return A promise that resolves with the screenshot URI -- a base64 encoded string which is usable as a src of an `<img>` element.
	 *
	 * **Errors**
	 *
	 * Warns if the resolution is 0 or negative.
	 *
	 */
	takeScreenShot(resolution?: Renderer.Resolution, visibility?: Partial<Renderer.Visibility>): Promise<string>;
	/**
	 * Takes an equirectangular screenshot (JPEG) of the currently active sweep.
	 *
	 * ```
	 * mpSdk.Renderer.takeEquirectangular()
	 *   .then(function (screenShotUri) {
	 *     // set src of an img element
	 *     img.src = screenShotUri
	 * });
	 * ```
	 *
	 * @return A promise that resolves with the screenshot URI -- a base64 encoded string which is usable as a src of an `<img>` element.
	 *
	 * **Errors**
	 *
	 * Warns if the camera is not in Panorama mode and is instead in Dollhouse or Floorplan mode.
	 *
	 * **Notes**
	 *
	 * It is not on Matterport servers and does not persist between user sessions.
	 */
	takeEquirectangular(): Promise<string>;
	/**
	 * Converts a screen position into a world position
	 *
	 * If the height is not passed in, the function returns the first raycast hit in the direction of that screen position.
	 * However, if there is no intersection with the model in that direction, the position will be null and the floor will be -1.
	 *
	 * ```
	 * const screenPosition {x: 0, y: 0}; // Top left corner of the screen
	 *
	 * mpSdk.Renderer.getWorldPositionData(screenPosition)
	 * .then(function(data){
	 *    const worldPosition = data.position; // e.g. {x: 2.2323231, y: 4.7523232, z; 7.92893};
	 *    const floor = data.floor; // e.g. 2
	 * });
	 * ```
	 *
	 * If the height is passed in, the function returns the intersection with the plane at that height. However,
	 * if there is no intersection with the plane in that direction, the position will be null and the floor will be -1.
	 *
	 * ```
	 * const screenPosition {x: 0, y: 0}; // Top left corner of the screen
	 * const height = 20;
	 *
	 * mpSdk.Renderer.getWorldPositionData(screenPosition, height)
	 * .then(function(data){
	 *    const worldPosition = data.position; // e.g. {x: 2.2323231, y: 20, z; 7.92893};
	 *    const floor = data.floor // e.g. 2
	 * });
	 * ```
	 * @param {Vector2} screenPosition The screen position in pixels from the top-left corner of the screen.
	 * For example, `{x: 300, y: 200}` would be the position 300 pixels right and 200 pixels down from the top-left corner.
	 * @param {number} [height] Optional parameter for the height of the horizontal plane to intersect. If not provided, the
	 * closest intersection with the model in that direction will be returned.
	 * @param {boolean} [includeHiddenFloors] Optional parameter that will include floors that are hidden and ghosted
	 * when determining the closest intersection with the model.
	 *
	 * **Notes**
	 *
	 * Returns null position if the direction of the screen position does not intersect with the model, or if a height was given,
	 * if the the direction does not intersect with the plane at the given height.
	 */
	getWorldPositionData(screenPosition: Vector2, height?: number, includeHiddenFloors?: boolean): Promise<Renderer.WorldPositionData>;
	/**
	 * @deprecated Use [[Conversion.worldToScreen]] to convert a 3d position to a point on screen.
	 */
	getScreenPosition(worldPosition: Vector3): Promise<Vector2>;
}
export declare namespace Room {
	type RoomData = {
		id: string;
		label: string;
		bounds: {
			min: Vector3;
			max: Vector3;
		};
		floorInfo: {
			id: string;
			sequence: number;
		};
		size: Vector3;
		center: Vector3;
	};
	type CurrentRooms = {
		rooms: Room.RoomData[];
	};
	namespace Conversion {
		/**
		 * Generate a map between v2 IDs and v1 IDs
		 *
		 * This method will help with migration between IDs used for rooms.
		 *
		 * ```
		 * const mapping = await mpSdk.Room.Conversion.createIdMap();
		 * ```
		 *
		 * @param invert?: boolean - if passed, return map of v1->v2 instead
		 */
		function createIdMap(invert?: boolean): Promise<Dictionary<string>>;
	}
}
export interface Room {
	Conversion: typeof Room.Conversion;
	/**
	 * An observable to determine which rooms the player's camera is currently in.
	 *
	 * If the camera is in a location between rooms, or somehwere where our room bounds overlap, the `rooms` array will contain both (or more) rooms.
	 * If the camera is in a mode other than `INSIDE`, the `rooms` array may be empty.
	 * If the camera is in an unaligned sweep, the `rooms` array will be empty.
	 *
	 * ```
	 * mpSdk.Room.current.subscribe(function (currentRooms) {
	 *   if (currentRooms.rooms.length > 0) {
	 *     console.log('currently in', currentRooms.rooms.length, 'rooms');
	 *   } else {
	 *     console.log('Not currently inside any rooms');
	 *   }
	 * });
	 * ```
	 */
	current: IObservable<Room.CurrentRooms>;
	/**
	 * An observable collection of Room data that can be subscribed to.
	 *
	 * See [[IObservableMap]] to learn how to receive data from the collection.
	 *
	 * ```
	 * mpSdk.Room.data.subscribe({
	 *   onCollectionUpdated: function (collection) {
	 *     console.log('Collection received. There are ', Object.keys(collection).length, 'rooms in the collection');
	 *   }
	 * });
	 * ```
	 */
	data: IObservableMap<Room.RoomData>;
}
/**
 * Our Sensor system allows for generating spatial queries to understand a Matterport digital twin.
 * By utilizing and setting up Sources around the scene, some questions that can be answered are:
 * - "what things are currently visible on screen?"
 * - "what things are near me?"
 *
 * where "things" can be Mattertag posts, sweeps, arbitrary locations (that you choose), or any combination of those.
 */
export declare namespace Sensor {
	enum SensorType {
		CAMERA = "sensor.sensortype.camera"
	}
	enum SourceType {
		SPHERE = "sensor.sourcetype.sphere",
		BOX = "sensor.sourcetype.box",
		CYLINDER = "sensor.sourcetype.cylinder"
	}
	/**
	 * A Sensor that detects Sources and provides information about the reading of each.
	 */
	interface ISensor extends IObservable<ISensor> {
		/** The world-space position of the sensor. */
		origin: Vector3;
		/** The world-space "forward" direction describing which direction the sensor is facing. */
		forward: Vector3;
		/**
		 * Add a source, to add its readings to the set of readings provided by `.subscribe`.
		 * @param sources
		 */
		addSource(...sources: ISource[]): void;
		/**
		 * Start receiving updates when properties of this sensor change, e.g. `origin` or `forward`, not its `readings`.<br>
		 * Subscribe to `readings` to receive updates about associated `ISources`
		 */
		subscribe<DataT>(observer: IObserver<DataT> | ObserverCallback<DataT>): ISubscription;
		/**
		 * An observable used to get information about assocated `ISources` added with [[ISensor.addSource]]
		 */
		readings: {
			/**
			 * Start receiving updates about the current set of sources added to this sensor.
			 * @param observer
			 */
			subscribe(observer: ISensorObserver): ISubscription;
		};
		/**
		 * Show debug visuals for this sensor. Existing visuals are disposed.
		 * @param show
		 */
		showDebug(show: boolean): void;
		/**
		 * Teardown and cleanup the sensor, and stop receiving updates.
		 */
		dispose(): void;
	}
	type SphereVolume = {
		/** The origin of the sphere. */
		origin: Vector3;
		/** The distance from origin of the sphere volume. */
		radius: number;
	};
	type BoxVolume = {
		/** The center position of the box. */
		center: Vector3;
		/** The length, width, and depth of the box volume. */
		size: Vector3;
		/** The orientation of the box. The rotations are applied in yaw, pitch, then roll order. */
		orientation: Orientation;
	};
	type CylinderVolume = {
		/** The point which defines the position (base) from which the height in the +Y, and radius in the XZ-plane are relative to. */
		basePoint: Vector3;
		/** The height of the cylinder. */
		height: number;
		/** The radius of the cylinder. */
		radius: number;
	};
	/**
	 * A Source represents a volume that will be detected by a Sensor.
	 * The type of the source, describes the type of volume associated with it.
	 * For example, with a `type` of `SourceType.SPHERE` the `volume` is a `SphereVolume`; a `SourceType.BOX` has a `BoxVolume`.
	 */
	interface ISource<Volume = SphereVolume | BoxVolume | CylinderVolume, UserData extends Record<string, unknown> = Record<string, unknown>> {
		/** The type of source. */
		type: SourceType;
		/** The volume that represents the range of emissions from this `ISource`. */
		volume: Volume;
		/** Arbitrary data that can be used to set additional metadata, for example. */
		userData: UserData;
		/**
		 * Let the sensor system know there is an update to this `ISource`.<br>
		 * When changing any properties on `volume`, no changes will be reflected on the source or in Showcase until `commit` is called.
		 */
		commit(): Promise<void>;
	}
	/**
	 * A specialized [[IMapObserver]] which maps an `ISource` to its current `SensorReading`.
	 */
	interface ISensorObserver {
		/** Called when a the first `reading` is added from `source`. */
		onAdded?(source: ISource, reading: SensorReading, collection: Map<ISource, SensorReading>): void;
		/** Called when `source` and its `reading` is removed. */
		onRemoved?(source: ISource, reading: SensorReading, collection: Map<ISource, SensorReading>): void;
		/** Called when an existing `reading` is altered from `source`. */
		onUpdated?(source: ISource, reading: SensorReading, collection: Map<ISource, SensorReading>): void;
		/** Called when a set of changes happens within the `collection`. */
		onCollectionUpdated?(collection: Map<ISource, SensorReading>): void;
	}
	/**
	 * Information about the Source as read by the Sensor.
	 */
	type SensorReading = {
		/** The sensor is currently within the broadcast range of the source. */
		inRange: boolean;
		/** The sensor is within the source's broadcast range and the sensor has clear line of sight to the source. */
		inView: boolean;
		/** The distance between the sensor and the source. */
		distance: number;
		/** The squared distance from the sensor to the source. */
		distanceSquared: number;
		/** The world-space direction from the sensor to the source. */
		direction: Vector3;
	};
	/**
	 * Additional `userData` to associate with an `ISource` when creating it.
	 * This is a free dictionary that can contain any key/values deemed necessary.
	 */
	type SourceOptions<UserData extends Record<string, unknown> = Record<string, unknown>> = {
		userData: UserData;
	};
}
export interface Sensor {
	SensorType: typeof Sensor.SensorType;
	SourceType: typeof Sensor.SourceType;
	/**
	 * Create an [[`ISensor`]] which can sense and provide information about [[`ISource`]].
	 *
	 * ```typescript
	 * const sensor = await mpSdk.Sensor.createSensor(mpSdk.Sensor.SensorType.CAMERA);
	 * // add sources from calls to `Sensor.createSource()`
	 * sensor.addSource(...sources);
	 * // start listening for changes to the sensor's readings
	 * sensor.readings.subscribe({
	 *   onAdded(source, reading) {
	 *     console.log(source.userData.id, 'has a reading of', reading);
	 *   },
	 *   onUpdated(source, reading) {
	 *     console.log(source.userData.id, 'has an updated reading');
	 *     if (reading.inRange) {
	 *       console.log(source.userData.id, 'is currently in range');
	 *       if (reading.inView) {
	 *         console.log('... and currently visible on screen');
	 *       }
	 *     }
	 *   }
	 * });
	 * ```
	 */
	createSensor(type: Sensor.SensorType.CAMERA): Promise<Sensor.ISensor>;
	/**
	 * Create a spherical [[`ISource`]] which can be sensed by an [[`ISensor`]].<br>
	 * A shallow copy of `options.userData` is applied to the Source upon creation.
	 *
	 * Omitting `options.origin` will default the source's `volume.origin` to `{ x: 0, y: 0, z: 0 }`.<br>
	 * Omitting `options.radius` will default the source's `volume.radius` to `Infinity`.
	 *
	 * ```typescript
	 * const sources: Array<Sensor.ISource<Sensor.SphereVolume, { id: string }>> = await Promise.all([
	 *   mpSdk.Sensor.createSource(mpSdk.Sensor.SourceType.SPHERE, {
	 *     origin: { x: 1, y: 2, z: 3 },
	 *     radius: 20,
	 *     userData: {
	 *       id: 'sphere-source-1',
	 *     },
	 *   }),
	 *   mpSdk.Sensor.createSource(mpSdk.Sensor.SourceType.SPHERE, {
	 *     radius: 4,
	 *     userData: {
	 *       id: 'sphere-source-2',
	 *     },
	 *   }),
	 * ]);
	 * // attach to a sensor previously created with `Sensor.createSensor()`
	 * sensor.addSource(...sources);
	 * ```
	 * @param options
	 */
	createSource<UserData extends Record<string, unknown> = Record<string, unknown>>(type: Sensor.SourceType.SPHERE, options: Partial<Sensor.SphereVolume & Sensor.SourceOptions<UserData>>): Promise<Sensor.ISource<Sensor.SphereVolume, UserData>>;
	/**
	 * Create an box shaped [[`ISource`]] which can be sensed by an [[`ISensor`]].<br>
	 * A shallow copy of `options.userData` is applied to the Source upon creation.
	 *
	 * Omitting `options.center` will default the source's `volume.center` to `{ x: 0, y: 0, z: 0 }`.<br>
	 * Omitting `options.size` will default the source's `volume.size` to `{ x: Infinity, y: Infinity, z: Infinity }`.
	 * Omitting `options.orientation` will default the source's `volume.orientatin` to `{ yaw: 0, pitch: 0, roll: 0 }`.
	 *
	 * ```typescript
	 * const sources: Array<Sensor.ISource<Sensor.BoxVolume, { id: string }>> = await Promise.all([
	 *   mpSdk.Sensor.createSource(mpSdk.Sensor.SourceType.BOX, {
	 *     center: { x: 1, y: 1, z: 1 },
	 *     size: { x: 2, y: 1, z: 2 },
	 *     userData: {
	 *       id: 'box-source-1',
	 *     },
	 *   }),
	 *   mpSdk.Sensor.createSource(mpSdk.Sensor.SourceType.BOX, {
	 *     size: { x: 2: y: 2, z: 2 },
	 *     orientation: { yaw: 45, pitch: 45, roll: 45 },
	 *     userData: {
	 *       id: 'box-source-2',
	 *     },
	 *   }),
	 * ]);
	 * // attach to a sensor previously created with `Sensor.createSensor()`
	 * sensor.addSource(...sources);
	 * ```
	 * @param options
	 */
	createSource<UserData extends Record<string, unknown> = Record<string, unknown>>(type: Sensor.SourceType.BOX, options: Partial<Sensor.BoxVolume & Sensor.SourceOptions<UserData>>): Promise<Sensor.ISource<Sensor.BoxVolume, UserData>>;
	/**
	 * Create a cylindrical [[`ISource`]] which can be sensed by an [[`ISensor`]].<br>
	 * A shallow copy of `options.userData` is applied to the Source upon creation.
	 *
	 * Omitting `options.basePoint` will default the source's `volume.basePoint` to `{ x: 0, y: 0, z: 0 }`.<br>
	 * Omitting `options.radius` will default the source's `volume.radius` to `Infinity`.<br>
	 * Omitting `options.height` will default the source's `volume.height` to `Infinity`.
	 *
	 * ```typescript
	 * const sources: Array<Sensor.ISource<Sensor.CylinderVolume, { id: string }>> = await Promise.all([
	 *   mpSdk.Sensor.createSource(mpSdk.Sensor.SourceType.CYLINDER, {
	 *     basePoint: { x: 0, y: 0, z: 0 },
	 *     radius: 2,
	 *     height: 5,
	 *     userData: {
	 *       id: 'cylinder-source-1',
	 *     },
	 *   }),
	 *   mpSdk.Sensor.createSource(mpSdk.Sensor.SourceType.CYLINDER, {
	 *     basePoint: { x: 1, y: 2, z: 3 },
	 *     radius: 3,
	 *     userData: {
	 *       id: 'cylinder-source-2',
	 *     },
	 *   }),
	 * ]);
	 * // attach to a sensor previously created with `Sensor.createSensor()`
	 * sensor.addSource(...sources);
	 * ```
	 */
	createSource<UserData extends Record<string, unknown> = Record<string, unknown>>(type: Sensor.SourceType.CYLINDER, options: Partial<Sensor.CylinderVolume & Sensor.SourceOptions<UserData>>): Promise<Sensor.ISource<Sensor.CylinderVolume, UserData>>;
}
export declare namespace Settings { }
export interface Settings {
	/**
	 * This function returns the value of a setting if it exists, if it does not currently exist, it will return undefined.
	 *
	 * ```
	 * mpSdk.Settings.get('labels')
	 *   .then(function(data) {
	 *     // Setting retrieval complete.
	 *     console.log('Labels setting: ' + data);
	 *   })
	 *   .catch(function(error) {
	 *     // Setting  retrieval error.
	 *   });
	 * ```
	 */
	get(key: string): Promise<any | undefined>;
	/**
	 * This function updates the value of a setting if it exists, returning the new value when it is set
	 *
	 * ```
	 * mpSdk.Settings.update('labels', false)
	 *   .then(function(data) {
	 *     // Setting update complete.
	 *     console.log('Labels setting: ' + data);
	 *   })
	 *   .catch(function(error) {
	 *     // Setting update error.
	 *   });
	 * ```
	 */
	update(key: string, value: any): Promise<void>;
}
export declare namespace Tag {
	enum AttachmentType {
		/** An unknown type of attachment. This should never happen */
		UNKNOWN = "tag.attachment.unknown",
		APPLICATION = "tag.attachment.application",
		AUDIO = "tag.attachment.audio",
		/** The attachment contains an image */
		IMAGE = "tag.attachment.image",
		/** The attachment contains rich content like an iframe of another site */
		MODEL = "tag.attachment.model",
		PDF = "tag.attachment.pdf",
		RICH = "tag.attachment.rich",
		TEXT = "tag.attachment.text",
		/** The attachment contains a video */
		VIDEO = "tag.attachment.video",
		ZIP = "tag.attachment.zip",
		/** The attachment is a sandbox created by a call to [[Tag.registerSandbox]] */
		SANDBOX = "tag.attachment.sandbox"
	}
	type TagData = {
		id: string;
		anchorPosition: Vector3;
		discPosition: Vector3;
		stemVector: Vector3;
		stemHeight: number;
		stemVisible: boolean;
		label: string;
		description: string;
		color: Color;
		roomId: string;
		/** The ids of the attachments currently attached to this tag */
		attachments: string[];
		keywords: string[];
		/** Read-only Font Awesome id for icons set in workshop, e.g. "face-grin-tongue-squint"
		 * This value does not change if [[Tag.editIcon]] is used. This value is an empty string if no fontId was set.
		*/
		fontId: string;
	};
	/**
	 * Things such as media, etc that can be attached to a Tag.
	 * Attachments are the new equivalent to Media in Mattertags.
	 */
	type Attachment = {
		id: string;
		src: string;
		type: AttachmentType;
	};
	/**
	 * A subset of the TagData used when adding Tags.
	 * Most properties are optional except those used for positioning: `anchorPosition`, `stemVector`.
	 */
	type Descriptor = {
		id?: string;
		anchorPosition: Vector3;
		stemVector: Vector3;
		stemVisible?: boolean;
		label?: string;
		description?: string;
		color?: Color;
		opacity?: number;
		iconId?: string;
		attachments?: string[];
	};
	type EditPositionDescriptor = {
		id: string;
		options: Partial<PositionOptions>;
	};
	type PositionOptions = {
		anchorPosition: Vector3;
		stemVector: Vector3;
		roomId: string;
	};
	type StemHeightEditOptions = {
		stemHeight: number;
		stemVisible: boolean;
	};
	/**
	 * @hidden
	 * @internal
	 * @experimental
	 */
	type ProgressOptions = {
		progress?: (percentComplete: number) => void;
	};
	/**
	 * @hidden
	 * @internal
	 * @experimental
	 */
	type ImportTagsOptions = {
		progress?: (percentComplete: number) => void;
		allowedLayers?: string[];
	};
	type EditableProperties = {
		label: string;
		description: string;
	};
	type SandboxOptions = {
		/**
		 * A map for the three global functions we provide in your sandbox.
		 * Only needs to be used if scripts you are importing also have a global `send`, `on`, `off`, `tag`, or `docked`.
		 */
		globalVariableMap: GlobalVariableMap;
		/**
		 * A human readable name that will be used as the `src` in the attachments collection.
		 */
		name: string;
		/**
		 * The size of the sandbox to display
		 * Providing `0` as one of the dimensions will instead use the default: 150px for height, 100% for width.
		 */
		size: Size;
	};
	/**
	 * Map the globals we provide in your sandbox to other names.
	 */
	type GlobalVariableMap = {
		send?: string;
		on?: string;
		off?: string;
		tag?: string;
		docked?: string;
	};
	/**
	 * A messaging object to send and receive messages to and from your iframe sandbox.
	 */
	interface IMessenger {
		/**
		 * Send a messages of type `eventType` to the iframe sandbox with any optional data associated with the message
		 */
		send(eventType: string, ...args: any[]): void;
		/**
		 * Add a handler for messages of type `eventType` from the iframe sandbox
		 */
		on(eventType: string, eventHandler: (...args: any[]) => void): void;
		/**
		 * Remove a handler for messages of type `eventType` from the iframe sandbox
		 */
		off(eventType: string, eventHandler: (...args: any[]) => void): void;
	}
	/**
	 * The actions that can be taken when interacting with a tag
	 */
	type AllowableActions = {
		/** Whether the tag can be opened via a mouse hover */
		opening: boolean;
		/** Whether navigation towared the tag will occur when clicked */
		navigating: boolean;
		/** Whether the tag can be docked */
		docking: boolean;
		/** Whether the tag has a share button */
		sharing: boolean;
	};
	type OpenOptions = {
		/** Force the tag open regardless of whether its allowed from previous calls to [[Tag.allowAction]] */
		force: boolean;
	};
	type OpenTags = {
		/** The id of the tag that is currently being previewed or hovered over. */
		hovered: string | null;
		/** The set of ids of tags that are currently "stuck" open like from a click action. Currently, this is limited to just one tag. */
		selected: Set<string>;
		/** The id of the tag that is currently docked. */
		docked: string | null;
	};
}
export interface Tag {
	AttachmentType: typeof Tag.AttachmentType;
	/**
	 * An observable collection of the [[Attachment]].
	 *
	 * ```typescript
	 * mpSdk.Tag.attachments.subscribe({
	 *   onAdded: function (index, item, collection) {
	 *     console.log('An attachment was added to the collection', index, item, collection);
	 *   },
	 *   onCollectionUpdated(collection) {
	 *     console.log('The entire collection of attachments', collection);
	 *   },
	 * });
	 * ```
	 *
	 * @embed
	 * @bundle
	 * @introduced 3.1.68.12-7-g858688944a
	 */
	attachments: IObservableMap<Tag.Attachment>;
	/**
	 * Attach [[Attachment]] to a Tag.
	 *
	 * ```typescript
	 * const tagId: string; // ... acquired through a previous call to `mpSdk.Tag.add` or through `mpSdk.Tag.data`
	 * const attachmentIds: string[]; // ... acquired through a previous call to `mpSdk.Tag.registerAttachment` or through `mpSdk.Tag.attachments`
	 *
	 * mpSdk.Tag.attach(tagId, ...attachmentIds);
	 * // or
	 * mpSdk.Tag.attach(tagId, attachmentId[0], attachmentId[1]);
	 * ```
	 *
	 * @param tagId
	 * @param attachmentId
	 * @return A promise that resolves when the Attachment is added to the Tag
	 *
	 * @embed
	 * @bundle
	 * @introduced 3.1.68.12-7-g858688944a
	 */
	attach(tagId: string, ...attachmentIds: string[]): Promise<void>;
	/**
	 * Read and create transient tags from another space.
	 *
	 * @hidden
	 * @internal
	 * @experimental
	 *
	 * @param sid external space id containg tags
	 * @param options
	 */
	importTags(spaceSid: string, options: Partial<Tag.ImportTagsOptions>): Promise<string[]>;
	/**
	 * Moves all transient tags into a persistent layer. Tag sids are not preserved.
	 *
	 * @return The list of newly created tags.
	 *
	 * @hidden
	 * @internal
	 * @experimental
	 *
	 * @param options
	 */
	saveToLayer(options: Partial<Tag.ProgressOptions>): Promise<string[]>;
	/**
	 * Detach [[Attachment]] from a Tag.
	 *
	 * ```typescript
	 * const tagId: string; // ... acquired through a previous call to `mpSdk.Tag.add` or through `mpSdk.Tag.data`
	 * const attachmentIds: string[]; // ... acquired through a previous call to `mpSdk.Tag.registerAttachment` or through `mpSdk.Tag.attachments`
	 *
	 * mpSdk.Tag.detach(tagId, ...attachmentIds);
	 * // or
	 * mpSdk.Tag.detach(tagId, attachmentId[0], attachmentId[1]);
	 * ```
	 *
	 * @param tagId
	 * @param attachmentIds
	 *
	 * @embed
	 * @bundle
	 * @introduced 3.1.70.10-0-ge9cb83b28c
	 */
	detach(tagId: string, ...attachmentIds: string[]): Promise<void>;
	/**
	 * Register a new [[Attachment]] that can later be attached as media to a Tag.
	 *
	 * Custom HTML can be added as an attachment through the use of [[registerSandbox]] instead.
	 *
	 * ```typescript
	 * // register a couple of attachments to use later
	 * const [attachmentId1, attachmentId2] = mpSdk.Tag.registerAttachment(
	 *   'https://[link.to/media]',
	 *   'https://[link.to/other_media]',
	 * );
	 * ```
	 * @param srcs The src URLs of the media
	 * @return A promise that resolves to an array of ids associated with the newly added Attachments
	 *
	 * @embed
	 * @bundle
	 * @introduced 3.1.68.12-7-g858688944a
	 */
	registerAttachment(...srcs: string[]): Promise<string[]>;
	/**
	 * Register an HTML sandbox that diplays custom HTML and runs custom scripts as an attachment.
	 * Data can be sent and received from the sandbox by using the returned [[IMessenger]].
	 *
	 * ```typescript
	 * const htmlToInject = `
	 *   <style>
	 *     button {
	 *       width: 100px;
	 *       height: 50px;
	 *     }
	 *   </style>
	 *   <button id='btn1'>CLICK ME</button>
	 *   <script>
	 *     var btn1 = document.getElementById('btn1');
	 *     btn1.addEventListener('click', () => {
	 *       // send data out of the sandbox
	 *       window.send('buttonClick', 12345);
	 *     });
	 *     // receive data from outside of the sandbox
	 *     window.on('updateButton', (newLabel, color) => {
	 *       btn1.innerText = newLabel;
	 *       btn1.style.backgroundColor = color;
	 *     });
	 *   </script>
	 * `;
	 *
	 * // create and register the sandbox
	 * const [sandboxId, messenger] = await mpSdk.Tag.registerSandbox(htmlToInject);
	 * // attach the sandbox to a tag
	 * mpSdk.Tag.attach(tagId, sandboxId);
	 * // receive data from the sandbox
	 * messenger.on('buttonClick', (buttonId) => {
	 *   console.log('clicked button with id:', buttonId);
	 * });
	 * // send data to the sandbox
	 * messenger.send('I send messages', 'red');
	 * ```
	 *
	 * @param html
	 * @param options
	 * @returns An [[IMessenger]] that can be used to communicate with the sandbox by sending and receiving data
	 *
	 * @embed
	 * @bundle
	 * @introduced 3.1.70.10-0-ge9cb83b28c
	 */
	registerSandbox(html: string, options?: Partial<Tag.SandboxOptions>): Promise<[
		string,
		Tag.IMessenger
	]>;
	/**
	 * An observable collection of Tag data that can be subscribed to.
	 *
	 * When first subscribing, the current set of Tags will call the observer's `onAdded` for each Tag as the data becomes available.
	 *
	 * ```typescript
	 * mpSdk.Tag.data.subscribe({
	 *   onAdded(index, item, collection) {
	 *     console.log('Tag added to the collection', index, item, collection);
	 *   },
	 *   onRemoved(index, item, collection) {
	 *     console.log('Tag removed from the collection', index, item, collection);
	 *   },
	 *   onUpdated(index, item, collection) {
	 *     console.log('Tag updated in place in the collection', index, item, collection);
	 *   },
	 *   onCollectionUpdated(collection) {
	 *     console.log('The full collection of Tags looks like', collection);
	 *   }
	 * });
	 * ```
	 *
	 * @embed
	 * @bundle
	 * @introduced 3.1.68.12-7-g858688944a
	 */
	data: IObservableMap<Tag.TagData>;
	/**
	 * An observable state of that tags that are hovered, selected, or docked.
	 * A Tag can be in all three states at once. A docked tag is also always considered selected.
	 *
	 * ```typescript
	 * mpSdk.Tag.openTags.subscribe({
	 *   prevState: {
	 *     hovered: null,
	 *     docked: null,
	 *     selected: null,
	 *   },
	 *   onChanged(newState) {
	 *     if (newState.hovered !== this.prevState.hovered) {
	 *       if (newState.hovered) {
	 *         console.log(newState.hovered, 'was hovered');
	 *       } else {
	 *         console.log(this.prevState.hovered, 'is no longer hovered');
	 *       }
	 *     }
	 *     if (newState.docked !== this.prevState.docked) {
	 *       if (newState.docked) {
	 *         console.log(newState.docked, 'was docked');
	 *       } else {
	 *         console.log(this.prevState.docked, 'was undocked');
	 *       }
	 *     }
	 *
	 *     // only compare the first 'selected' since only one tag is currently supported
	 *     const [selected = null] = newState.selected; // destructure and coerce the first Set element to null
	 *     if (selected !== this.prevState.selected) {
	 *         if (selected) {
	 *             console.log(selected, 'was selected');
	 *         } else {
	 *             console.log(this.prevState.selected, 'was deselected');
	 *         }
	 *     }
	 *
	 *     // clone and store the new state
	 *     this.prevState = {
	 *       ...newState,
	 *       selected,
	 *     };
	 *   },
	 * });
	 * ```
	 *
	 * @embed
	 * @bundle
	 * @introduced 23.2.1
	 */
	openTags: IObservable<Tag.OpenTags>;
	/**
	 * Add one or more Tags to Showcase.
	 * Each input Tag supports setting the label, description, color or icon, anchorPosition, stemVector, and attachments.
	 *
	 * Two properties are required:
	 * - `anchorPosition`, the point where the tag connects to the model
	 * - `stemVector`, the direction, aka normal, and height that the Tag stem points
	 *
	 * See [[Pointer.intersection]] for a way to retrieve a new `anchorPosition` and `stemVector`.
	 *
	 * **Note**: these changes are not persisted between refreshes of Showcase. They are only valid for the current browser session.
	 * They also do not have "share" buttons as they associated with them.
	 *
	 * ```typescript
	 * mpSdk.Tag.add({
	 *  label: 'New tag',
	 *  description: 'This tag was added through the Matterport SDK',
	 *  anchorPosition: {
	 *    x: 0,
	 *    y: 0,
	 *    z: 0,
	 *  },
	 *  stemVector: { // make the Tag stick straight up and make it 0.30 meters (~1 foot) tall
	 *    x: 0,
	 *    y: 0.30,
	 *    z: 0,
	 *  },
	 *  color: { // blue disc
	 *    r: 0.0,
	 *    g: 0.0,
	 *    b: 1.0,
	 *  },
	 * }, {
	 *  label: 'New tag 2',
	 *  anchorPosition: {
	 *    x: 1,
	 *    y: 2,
	 *    z: 3,
	 *  },
	 *  stemVector: {
	 *    x: ,
	 *    y: ,
	 *    z: ,
	 *  }
	 * });
	 * ```
	 *
	 * @param tags The descriptors for all Tags to be added.
	 * @returns A promise that resolves with the array of ids for the newly added Tags.
	 *
	 * @embed
	 * @bundle
	 * @introduced 3.1.68.12-7-g858688944a
	 */
	add(...tags: Tag.Descriptor[]): Promise<string[]>;
	/**
	 * Sets the allowed "default" Showcase actions on a Tag from occurring: hover to open billboard, click to navigate to view.
	 * If an action is ommited from the actions argument, it will be considered false by default.
	 *
	 * ```typescript
	 * const tagIds: string[]; // ... acquired through previous calls to `mpSdk.Tag.add` or through `mpSdk.Tag.data`
	 *
	 * // prevent navigating to the tag on click
	 * const noNavigationTag = tagIds[0];
	 * mpSdk.Tag.allowAction(noNavigationTag, {
	 *   opening: true,
	 *   // implies navigating: false, etc
	 * });
	 *
	 * // prevent the billboard from showing
	 * const noBillboardTag = tagIds[1];
	 * mpSdk.Tag.allowAction(noBillboardTag, {
	 *   navigating: true,
	 *   // implies opening: false, etc
	 * });
	 *
	 * const noActionsTag = tagIds[2];
	 * mpSdk.Tag.allowAction(noActionsTag, {
	 *   // implies opening: false and navigating: false, etc
	 * });
	 * ```
	 *
	 * @param id The id of the Tag to change the allowed actions
	 * @param actions The set of actions allowed on the Tag
	 *
	 * @embed
	 * @bundle
	 * @introduced 3.1.68.12-7-g858688944a
	 */
	allowAction(id: string, actions: Partial<Tag.AllowableActions>): Promise<void>;
	/**
	 * Open a tag and display its billboard.
	 * Opening a second tag will close the first.
	 *
	 * ```typescript
	 * mpSdk.Tag.open(tagId);
	 *
	 * // if the tag has had its `dock` option removed through a call to `Tag.allowAction`, it can be `force`d open
	 * mpSdk.Tag.allowAction(tagId, {
	 *   opening: false,
	 * });
	 * mpSdk.Tag.open(tagId,
	 *   force: true,
	 * });
	 * ```
	 *
	 * @param id
	 * @param options
	 *
	 * @embed
	 * @bundle
	 * @introduced 23.2.1
	 */
	open(id: string, options?: Partial<Tag.OpenOptions>): Promise<void>;
	/**
	 * Close a tag and its billboard or dock.
	 *
	 * ```typescript
	 * const tagId: string; // ... acquired through previous calls to `mpSdk.Tag.add` or through `mpSdk.Tag.data`
	 * mpSdk.Tag.open(tagId);
	 * mpSdk.Tag.close(tagId);
	 * ```
	 *
	 * @param id
	 * @embed
	 * @bundle
	 * @introduced 23.2.1
	 */
	close(id: string): Promise<void>;
	/**
	 * Open a tag in the docked view.
	 *
	 * ```typescript
	 * const tagId: string; // ... acquired through previous calls to `mpSdk.Tag.add` or through `mpSdk.Tag.data`
	 * mpSdk.Tag.dock(tagId);
	 * ```
	 *
	 * @param id
	 * @param options
  
	 * @embed
	 * @bundle
	 * @introduced 23.2.1
	 */
	dock(id: string, options?: Partial<Tag.OpenOptions>): Promise<void>;
	/**
	 * Edit the text content in a Tag's billboard.
	 *
	 * **Note**: these changes are not persisted between refreshes of Showcase. They are only valid for the current browser session.
	 *
	 * ```typescript
	 * mpSdk.Tag.editBillboard(id, {
	 *   label: 'This is a new title',
	 *   description: 'This image was set dynamically by the Showcase sdk',
	 * });
	 * ```
	 * @param id the id of the Tag to edit
	 * @param properties A dictionary of properties to set
	 *
	 * @embed
	 * @bundle
	 * @introduced 3.1.68.12-7-g858688944a
	 */
	editBillboard(id: string, properties: Partial<Tag.EditableProperties>): Promise<void>;
	/**
	 * Edit the color of a Tag's disc.
	 *
	 * ```typescript
	 * const tagIds: string[]; // ... acquired through previous calls to `mpSdk.Tag.add` or through `mpSdk.Tag.data`
	 *
	 * // change the first Tag to yellow
	 * mpSdk.Tag.editColor(tagIds[0], {
	 *   r: 0.9,
	 *   g: 0,
	 *   b: 0.9,
	 * });
	 * ```
	 *
	 * @param id The id of the Tag to edit
	 * @param color The new color to be applied to the Tag disc
	 *
	 * @embed
	 * @bundle
	 * @introduced 3.1.68.12-7-g858688944a
	 */
	editColor(id: string, color: Color): Promise<void>;
	/**
	 * Change the icon of the Tag disc. Icons can be registered asset textures or font ids provided by the player.
	 * Supported font ids can be found at https://matterport.github.io/showcase-sdk/tags_icons_reference.html.
	 *
	 * **Note**: these changes are not persisted between refreshes of Showcase. They are only valid for the current browser session.
	 *
	 * ```typescript
	 * // change the icon of the Tag using the id used in a previous `Asset.registerTexture` call
	 * mpSdk.Tag.editIcon(id, 'customIconId');
	 * ```
	 *
	 * ```typescript
	 * // change the icon of the Tag to a font id.
	 * mpSdk.Tag.editIcon(id, 'public_buildings_apartment');
	 * ```
	 *
	 * @param tagId The id of the Tag to edit
	 * @param iconId The id of the icon to apply
	 *
	 * @embed
	 * @bundle
	 * @introduced 3.1.68.12-7-g858688944a
	 */
	editIcon(tagId: string, iconId: string): Promise<void>;
	/**
	 * Edit the opacity of a Tag.
	 *
	 * A completely transparent/invisible Tag is still interactable and will respond to mouse hovers and clicks.
	 *
	 * ```typescript
	 * const tagIds: string[]; // ... acquired through previous calls to `mpSdk.Tag.add` or through `mpSdk.Tag.data`
	 * // make the first Tag invisible
	 * mpSdk.Tag.editOpacity(tagIds[0], 0);
	 *
	 * // make another Tag transparent
	 * mpSdk.Tag.editOpacity(tagIds[1], 0.5);
	 *
	 * // and another completely opaque
	 * mpSdk.Tag.editOpacity(tagIds[2], 1);
	 * ```
	 *
	 * @param id The id of the Tag to edit
	 * @param opacity The target opacity for the Tag in the range of [0, 1]
	 *
	 * @embed
	 * @bundle
	 * @introduced 3.1.68.12-7-g858688944a
	 */
	editOpacity(id: string, opacity: number): Promise<void>;
	/**
	 * Edit the stem of a Tag
	 *
	 * ```typescript
	 * const tagId: string = tagData[0].id; // ... acquired through a previous call to `mpSdk.Tag.add` or through `mpSdk.Tag.data`
	 *
	 * // make the first Tag have an invsible stem
	 * mpSdk.Tag.editStem(tagId, {stemVisible: false});
	 *
	 * // make another Tag have a long stem
	 * mpSdk.Tag.editStem(tagId, {stemHeight: 1});
	 * ```
	 *
	 * @param tagSid The sid of the Tag to edit
	 * @param stemOptions What to change about the Tag's stem - can include stemHeight and stemVisible
	 *
	 * @embed
	 * @bundle
	 * @introduced 3.1.70.10-0-ge9cb83b28c
	 */
	editStem(tagSid: string, options: Partial<Tag.StemHeightEditOptions>): Promise<void>;
	/**
	 * Move and reorient a Tag.
	 *
	 * See [[Pointer.intersection]] for a way to retrieve a new `anchorPosition` and `stemVector`.
	 *
	 * **Note**: these changes are not persisted between refreshes of Showcase. They are only valid for the current browser session.
	 *
	 * ```typescript
	 * const tagId: string; // ... acquired through a previous call to `mpSdk.Tag.add` or through `mpSdk.Tag.data`
	 *
	 * mpSdk.Tag.editPosition(tagId, {
	 *  anchorPosition: {
	 *    x: 0,
	 *    y: 0,
	 *    z: 0,
	 *  },
	 *  stemVector: { // make the Tag stick straight up and make it 0.30 meters (~1 foot) tall
	 *    x: 0,
	 *    y: 0.30,
	 *    z: 0,
	 *  },
	 * });
	 * ```
	 * @param id The id of the Tag to reposition
	 * @param options The new anchorPosition, stemVector and/or roomId to associate the tag with.
	 *
	 * @embed
	 * @bundle
	 * @introduced 3.1.68.12-7-g858688944a
	 */
	editPosition(id: string, options: Partial<Tag.PositionOptions>): Promise<void>;
	/**
	 * Move and reorient a list of Tags. Prefer to call this method once over calling [[Tag.editPosition]] multiple times.
	 *
	 * ```
	 * const newRoomId; // precomputed room id
	 * const tagId1, tagId2, tagId3; // predetermined tag ids.
	 * const tagIds: MpSdk.Tag.EditPositionDescriptor[] = []; // an array of tag edit position descriptors
	 *
	 * // updates anchorPosition for tag1
	 * tagIds.push({
	 *   id: tag1,
	 *   options: {
	 *     anchorPosition: {
	 *       x: 0,
	 *       y: 0,
	 *       z: 0,
	 *     },
	 *   },
	 * });
	 *
	 * // updates roomId for tag2
	 * tagIds.push({
	 *   id: tag2,
	 *   options: {
	 *     roomId: newRoomId,
	 *   },
	 * });
	 *
	 * // updates stemVector for tag3
	 * tagIds.push({
	 *   id: tag3,
	 *   options: {
	 *     stemVector: { // make the Tag stick straight up and make it 0.30 meters (~1 foot) tall
	 *       x: 0,
	 *       y: 0.30,
	 *       z: 0,
	 *     },
	 *   },
	 * });
	 *
	 * // apply bulk updates
	 * await mpSdk.Tag.editPositions(...tagIds);
	 *
	 * ```
	 * @param tags The edit position descriptors for all Tags to be modified.
	 */
	editPositions(...tags: Tag.EditPositionDescriptor[]): Promise<void>;
	/**
	 * Removes one or more Tags from Showcase.
	 *
	 * **Note**: these changes are not persisted between refreshes of Showcase. They are only valid for the current browser session.
	 *
	 * ```typescript
	 * const tagIds: string[]; // ... acquired through a previous call to `mpSdk.Tag.add` or through `mpSdk.Tag.data`
	 * // remove one tag
	 * mpSdk.Tag.remove(tagIds[0]);
	 *
	 * // or remove multiple at the same time
	 * mpSdk.Tag.remove(...tagIds);
	 * ```
	 * @param ids The Tags' ids to be removed.
	 * @returns A promise with an array of Tag ids that were actually removed.
	 *
	 * @embed
	 * @bundle
	 * @introduced 3.1.68.12-7-g858688944a
	 */
	remove(...ids: string[]): Promise<string[]>;
	/**
	 * Resets the icon of the Tag disc back to its original icon.
	 *
	 * ```typescript
	 * const tagIds: string[]; // ... acquired through a previous call to `mpSdk.Tag.add` or through `mpSdk.Tag.data`
	 *
	 * // reset the icon of the first Tag to its original
	 * mpSdk.Tag.resetIcon(tagIds[0].id);
	 * ```
	 *
	 * @param id The id of the Tag to reset
	 *
	 * @embed
	 * @bundle
	 * @introduced 3.1.68.12-7-g858688944a
	 */
	resetIcon(id: string): Promise<void>;
	/**
	 * Toggle the overhead navigation UI
	 *
	 * ```typescript
	 * // hide the controls
	 * mpSdk.Tag.toggleNavControls(false);
	 *
	 * // show the controls
	 * mpSdk.Tag.toggleNavControls(true);
	 *
	 * // toggle the current visibility of the controls
	 * mpSdk.Tag.toggleNavControls();
	 * ```
	 * @param enable
	 *
	 * @embed
	 * @bundle
	 * @introduced 23.3.1
	 */
	toggleNavControls(enable?: boolean): Promise<void>;
	/**
	 * Toggle the dock setting to hide dock buttons in all tags.
	 *
	 * Disabling the dock setting will remove the dock buttons from all tags.
	 * Enabling the dock setting does not automatically show the dock button in all tags.
	 * The dock button will only be displayed in a tag if both the dock setting is true and docking is allowed by the tag (see [[Tag.allowAction]]).
	 *
	 * ```typescript
	 * // hide the dock buttons
	 * mpSdk.Tag.toggleDocking(false);
	 *
	 * // show the dock buttons
	 * mpSdk.Tag.toggleDocking(true);
	 *
	 * // toggle the current visibility of the dock buttons
	 * mpSdk.Tag.toggleDocking();
	 * ```
	 * @param enable
	 *
	 * @embed
	 * @bundle
	 * @introduced 23.4.2
	 */
	toggleDocking(enable?: boolean): Promise<void>;
	/**
	 * Toggle the share setting to hide share buttons in all tags.
	 *
	 * Disabling the share setting will remove the share buttons from all tags.
	 * Enabling the share setting does not automatically show the share button in all tags.
	 * The share button will only be displayed in a tag if both the share setting is true and sharing is allowed by the tag (see [[Tag.allowAction]]).
	 *
	 * ```typescript
	 * // hide the share buttons
	 * mpSdk.Tag.toggleSharing(false);
	 *
	 * // show the share buttons
	 * mpSdk.Tag.toggleSharing(true);
	 *
	 * // toggle the current visibility of the share buttons
	 * mpSdk.Tag.toggleSharing();
	 * ```
	 * @param enable
	 *
	 * @embed
	 * @bundle
	 * @introduced 23.4.2
	 */
	toggleSharing(enable?: boolean): Promise<void>;
}
declare namespace Test {
	namespace Sub {
		/**
		 * Call an asynchronous command with a parameter and get the same value back.
		 * @param arg
		 */
		function echo(arg: string): Promise<string>;
		/**
		 * Call an asynchronous command with a parameter and get the same value back.
		 * @param arg
		 */
		function echoAsync(arg: string): Promise<string>;
		namespace Sub2 {
			/**
			 * Call an asynchronous command with a parameter and get the same value back.
			 * @param arg
			 */
			function echo(arg: string): Promise<string>;
			/**
			 * Call an asynchronous command with a parameter and get the same value back.
			 * @param arg
			 */
			function echoAsync(arg: string): Promise<string>;
		}
	}
}
interface Test {
	/**
	 * Call a synchronous command with a parameter and get the same value back.
	 * @param arg
	 */
	echo(arg: string): Promise<string>;
	/**
	 * Call an asynchronous command with a parameter and get the same value back.
	 * @param arg
	 */
	echoAsync(arg: string): Promise<string>;
	/**
	 * Get the current visibility state of Tags. Visibility can be affected by which layers are active.
	 */
	getTagVisibility(): Promise<Record<string, boolean>>;
	/**
	 * A sub-namespace that simply namespaces and sub-namespaces the functions in this interface
	 */
	Sub: {
		echo: typeof Test.Sub.echo;
		echoAsync: typeof Test.Sub.echoAsync;
		Sub2: {
			echo: typeof Test.Sub.Sub2.echo;
			echoAsync: typeof Test.Sub.Sub2.echoAsync;
		};
	};
}
/**
 * Sample custom tour.
 *
 * ```
 * const connect = function(sdk) {
 *   const mpSdk = sdk;
 *
 *   mpSdk.Tour.Event.on(Tour.Event.STEPPED, function(tourIndex){
 *     console.log('Tour index ' + tourIndex);
 *   });
 *   mpSdk.Tour.Event.on(Tour.Event.STARTED, function(){
 *     console.log('Tour started');
 *   });
 *   mpSdk.Tour.Event.on(Tour.Event.STOPPED, function(){
 *     console.log('Tour stopped');
 *   });
 *
 *   mpSdk.Tour.getData()
 *     .then(function(tour) {
 *       console.log('tour has ' + tour.length + ' stops');
 *       return mpSdk.Tour.start(0);
 *     })
 *     .then(function(){
 *       // console 'Tour started'
 *       // console -> 'Tour index 0'
 *       return mpSdk.Tour.next();
 *     })
 *     .then(function(){
 *       // console -> 'Tour index 1'
 *       return mpSdk.Tour.step(3);
 *     })
 *     .then(function(){
 *       // console -> 'Tour index 3'
 *       return mpSdk.Tour.prev();
 *     })
 *     .then(function(){
 *       // console -> 'Tour index 2'
 *       // console -> 'Tour stopped'
 *       return mpSdk.Tour.stop();
 *     });
 * }
 * ```
 *
 */
export declare namespace Tour {
	type Snapshot = {
		sid: string;
		thumbnailUrl: string;
		imageUrl: string;
		is360: boolean;
		name: string;
		mode: Mode.Mode | undefined;
		position: Vector3;
		rotation: Vector3;
		zoom: number;
	};
	enum Event {
		/** @event */
		STARTED = "tour.started",
		/** @event */
		STOPPED = "tour.stopped",
		/** @event */
		ENDED = "tour.ended",
		/** @event */
		STEPPED = "tour.stepped"
	}
	type CurrentStepData = {
		step: string | null;
	};
	enum PlayState {
		INACTIVE = "tour.inactive",
		ACTIVE = "tour.active",
		STOP_SCHEDULED = "tour.stopscheduled"
	}
	type CurrentStateData = {
		current: PlayState;
	};
	type CurrentTransitionData = {
		from: string | null;
		to: string | null;
	};
}
export declare interface Tour {
	Event: typeof Tour.Event;
	PlayState: typeof Tour.PlayState;
	/**
	 * This function starts the tour.
	 *
	 * ```
	 * const tourIndex = 1;
	 *
	 * mpSdk.Tour.start(tourIndex)
	 *   .then(function() {
	 *     // Tour start complete.
	 *   })
	 *   .catch(function(error) {
	 *     // Tour start error.
	 *   });
	 * ```
	 *
	 * @embed
	 * @bundle
	 */
	start(index?: number): Promise<void>;
	/**
	 * This function stops the tour.
	 *
	 * ```
	 * mpSdk.Tour.stop()
	 *   .then(function() {
	 *     // Tour stop complete.
	 *   })
	 *   .catch(function(error) {
	 *     // Tour stop error.
	 *   });
	 * ```
	 *
	 * @embed
	 * @bundle
	 */
	stop(): Promise<void>;
	/**
	 * This function moves the camera to a specific snapshot in the tour.
	 *
	 * ```
	 * const myStep = 2;
	 * mpSdk.Tour.step(myStep)
	 *   .then(function() {
	 *     //Tour step complete.
	 *   })
	 *   .catch(function(error) {
	 *     // Tour step error.
	 *   });
	 * ```
	 *
	 * @embed
	 * @bundle
	 */
	step(index: number): Promise<void>;
	/**
	 * This function moves the camera to the next snapshot in the tour.
	 *
	 * ```
	 * mpSdk.Tour.next()
	 *   .then(function() {
	 *     // Tour next complete.
	 *   })
	 *   .catch(function(error) {
	 *     // Tour next error.
	 *   });
	 * ```
	 *
	 * @embed
	 * @bundle
	 */
	next(): Promise<void>;
	/**
	 * This function moves the camera to the previous snapshot in the tour.
	 *
	 * ```
	 * mpSdk.Tour.prev()
	 *   .then(function() {
	 *     // Tour prev complete.
	 *   })
	 *   .catch(function(error) {
	 *     // Tour prev error.
	 *   });
	 * ```
	 *
	 * @embed
	 * @bundle
	 */
	prev(): Promise<void>;
	/**
	 * This function returns an array of Snapshots.
	 *
	 * ```
	 * mpSdk.Tour.getData()
	 *   .then(function(snapshots) {
	 *     // Tour getData complete.
	 *     if(snapshots.length > 0){
	 *       console.log('First snapshot sid: ' + snapshots[0].sid);
	 *       console.log('First snapshot name: ' + snapshots[0].name);
	 *       console.log('First snapshot position: ' + snapshots[0].position);
	 *     }
	 *   })
	 *   .catch(function(error) {
	 *     // Tour getData error.
	 *   });
	 * ```
	 *
	 * @embed
	 * @bundle
	 */
	getData(): Promise<Tour.Snapshot[]>;
	/**
	 * The zero-indexed current Tour step.
	 * The step will be null if no Tour is currently playing.
	 *
	 * ```
	 * mpSdk.Tour.currentStep.subscribe(function (current) {
	 *   // the step index has changed
	 *   // 0 for the first step, 1 for the second, etc.
	 *   console.log('Current step is ', current.step);
	 * });
	 * ```
	 *
	 * @embed
	 * @bundle
	 * @introduced 3.1.68.12-7-g858688944a
	 */
	currentStep: IObservable<Tour.CurrentStepData>;
	/**
	 * An observable state of the current Tour. Returns a Tour.PlayState of
	 * `INACTIVE` (no tour in progress), `ACTIVE` (tour in progress), or `STOP_SCHEDULED`
	 * (tour in progress, but a stop has been queued by the user or automatically by the tour ending).
	 *
	 * ```
	 * mpSdk.Tour.state.subscribe(function (state) {
	 *   // the state has changed
	 *   console.log('Current state is ', state.current);
	 * });
	 * ```
	 *
	 * @embed
	 * @bundle
	 * @introduced 3.1.68.12-7-g858688944a
	 */
	state: IObservable<Tour.CurrentStateData>;
	/**
	 * An observable representing the current Tour's transition.
	 *
	 * `{ from: string | null, to: string | null }`.
	 *
	 * `from` can be `null` when transitioning from outside of a tour. `from` and `to` will both be `null` when
	 * there is no active transition.
	 *
	 * ```
	 * mpSdk.Tour.transition.subscribe(function (transition) {
	 *   // the transition has changed
	 *   console.log('Current transition is ', transition.from, transition.to);
	 * });
	 * ```
	 *
	 * @embed
	 * @bundle
	 * @introduced 3.1.68.12-7-g858688944a
	 */
	transition: IObservable<Tour.CurrentTransitionData>;
}
export declare namespace View {
	interface View extends IObservable<View> {
		/** the unique id of the View */
		readonly id: string;
		/** the human-readable name of the View */
		readonly name: string;
		/** whether this is the active View or not */
		readonly active: boolean;
		/**
		 * An iterator over the set of Layers associated with this View
		 *
		 * ```typescript
		 * for (const layer of view.layers) {
		 *   console.log(`${view.id} has layer ${layer.id}`);
		 * }
		 * ```
		 */
		readonly layers: IterableIterator<Layer>;
		/**
		 * Set this View as the currently active one optionally, returning to the start location for the new View.
		 *
		 * Only one View can be active at a time.
		 *
		 * ```typescript
		 * const view: View; // ... acquired through previous usage of `mpSdk.View.views`
		 * await view.setActive(true); // set the active view and return to the start location
		 * ```
		 */
		setActive(returnToStart?: boolean): Promise<void>;
		/**
		 * Add a Layer to this View
		 *
		 * ```typescript
		 * view.addLayer(layer);
		 * ```
		 * @param layer
		 */
		addLayer(layer: Layer): Promise<void>;
		/**
		 * Remove a Layer from this View
		 *
		 * ```typescript
		 * view.removeLayer(layer);
		 * ```
		 * @param layer
		 */
		removeLayer(layer: Layer): Promise<void>;
		/**
		 * Test if this View has a Layer associate with it
		 *
		 * ```typescript
		 * if (view.hasLayer(layer)) {
		 *   console.log(`${view.id} has layer ${layer.id}`);
		 * }
		 * ```
		 * @param layer
		 */
		hasLayer(layer: Layer): boolean;
	}
	interface Layer extends IObservable<Layer> {
		/** The unique id of the Layer */
		readonly id: string;
		/** The human-readable name of the Layer */
		readonly name: string;
		/** Whether this Layer toggled on or off. If toggled off, this Layer's objects are hidden. */
		readonly toggled: boolean;
		/**
		 * Toggle this Layer's state to `active`.
		 *
		 * @param active Whether this Layer toggled on or off. If `active` is undefined, the state is flipped.
		 */
		toggle(active?: boolean): Promise<void>;
		/**
		 * A subset of the Tag namespace's functionality to manipulate Tags on this layer.
		 */
		Tag: Partial<Tag>;
	}
}
export interface View {
	/**
	 * The currently active view
	 *
	 * ```typescript
	 * mpSdk.View.current.subscribe((currentView) => {
	 *   console.log('the currently active view is', currentView.name);
	 * });
	 * ```
	 * @earlyaccess
	 */
	current: IObservable<View.View>;
	/**
	 * All views associated with the current space.
	 *
	 * ```typescript
	 * mpSdk.View.views.subscribe({
	 *   onAdded(index, view, collection) {
	 *     console.log('a view with id', view.id, 'named', view.name);
	 *   },
	 *   onCollectionUpdated(collection) {
	 *     console.log('all views', collection);
	 *   },
	 * });
	 * ```
	 * @earlyaccess
	 */
	views: IObservableMap<View.View>;
	/**
	 * All layers associated with the current space.
	 *
	 * Layers in inactive Views may not populate right away. Activating a View will trigger the Layers to populate.
	 *
	 * ```typescript
	 * mpSdk.View.layers.subscribe({
	 *   onAdded(index, layer, collection) {
	 *     console.log('a layer with id', layer.id, 'named', layer.name);
	 *   },
	 *   onCollectionUpdated(collection) {
	 *     console.log('all layers', collection);
	 *   },
	 * });
	 * ```
	 */
	layers: IObservableMap<View.Layer>;
	/**
	 * Create a layer that can be later added to a View or Views
	 *
	 * ```typescript
	 * const layer = await mpSdk.View.createLayer('my layer');
	 * ```
	 * @param name
	 */
	createLayer(name: string): Promise<View.Layer>;
}
interface Emitter {
	/** Start listening for an event */
	on: typeof on;
	/** Stop listening for an event */
	off: typeof off;
}
declare function off(event: any, callback: (...any: any[]) => void): Emitter;
declare function on(event: App.Event.PHASE_CHANGE, callback: (app: App.Phase) => void): Emitter;
declare function on(event: Camera.Event.MOVE, callback: (pose: Camera.Pose) => void): Emitter;
declare function on(event: Floor.Event.CHANGE_START, callback: (to: number, from: number) => void): Emitter;
declare function on(event: Floor.Event.CHANGE_END, callback: (floorIndex: number, floorName: string) => void): Emitter;
declare function on(event: Label.Event.POSITION_UPDATED, callback: (labelData: Label.Label[]) => void): Emitter;
declare function on(event: Mattertag.Event.HOVER, callback: (tagSid: string, hovering: boolean) => void): Emitter;
declare function on(event: Mattertag.Event.CLICK, callback: (tagSid: string) => void): Emitter;
declare function on(event: Mattertag.Event.LINK_OPEN, callback: (tagSid: string, url: string) => void): Emitter;
declare function on(event: Mode.Event.CHANGE_START, callback: (oldMode: string, newMode: string) => void): Emitter;
declare function on(event: Mode.Event.CHANGE_END, callback: (oldMode: string, newMode: string) => void): Emitter;
declare function on(event: Model.Event.MODEL_LOADED, callback: (model: Model.ModelData) => void): Emitter;
declare function on(event: Sweep.Event.ENTER, callback: (oldSweep: string, newSweep: string) => void): Emitter;
declare function on(event: Sweep.Event.EXIT, callback: (fromSweep: string, toSweep: string | undefined) => void): Emitter;
declare function on(event: Tour.Event.STARTED, callback: () => void): Emitter;
declare function on(event: Tour.Event.STOPPED, callback: () => void): Emitter;
declare function on(event: Tour.Event.ENDED, callback: () => void): Emitter;
declare function on(event: Tour.Event.STEPPED, callback: (activeIndex: number) => void): Emitter;
/**
 * The entire MP Sdk returned from a successful call to `MP_SDK.connect` on the [[ShowcaseEmbedWindow]].
 *
 * ```typescript
 * const sdk: CommonMpSdk = await window.MP_SDK.connect(...);
 * ```
 */
export type CommonMpSdk = {
	App: App;
	Asset: Asset;
	Camera: Camera;
	Conversion: Conversion;
	Floor: Floor;
	Graph: Graph;
	Label: Label;
	Link: Link;
	Mattertag: Mattertag;
	Measurements: Measurements;
	Mode: Mode;
	Model: Model;
	OAuth: OAuth;
	Pointer: Pointer;
	Renderer: Renderer;
	Room: Room;
	Sensor: Sensor;
	Settings: Settings;
	Sweep: Sweep;
	Tag: Tag;
	Test: Test;
	Tour: Tour;
	View: View;
	on: typeof on;
	off: typeof off;
	disconnect: typeof disconnect;
};
export declare namespace CommonMpSdk {
	export { Color, ConditionCallback, Dictionary, ICondition, IMapObserver, IObservable, IObservableMap, IObserver, ISubscription, ObserverCallback, Orientation, Rotation, Size, Vector2, Vector3, };
	export { App, Asset, Camera, Conversion, Floor, Graph, Label, Link, Mattertag, Measurements, Mode, Model, OAuth, Pointer, Renderer, Room, Sensor, Settings, Sweep, Tag, Tour, View, };
}
/**
 * The Scene namespace is currently only available for Bundle SDK distributions.
 * [Learn more about the Bundle SDK](https://matterport.github.io/showcase-sdk/sdkbundle_home.html)
 */
export declare namespace Scene {
	export enum Component {
		OBJ_LOADER = "mp.objLoader",
		FBX_LOADER = "mp.fbxLoader",
		DAE_LOADER = "mp.daeLoader",
		GLTF_LOADER = "mp.gltfLoader",
		SCROLLING_TUBE = "mp.scrollingTube",
		TRANSFORM_CONTROLS = "mp.transformControls",
		LIGHTS_COMPONENT = "mp.lights",
		POINT_LIGHT = "mp.pointLight",
		DIRECTIONAL_LIGHT = "mp.directionalLight",
		AMBIENT_LIGHT = "mp.ambientLight",
		CAMERA = "mp.camera",
		INPUT = "mp.input",
		XR = "mp.xr"
	}
	export type SceneComponentName = `${Component}` | (string & {});
	interface LightComponentCommonOptions {
		/** If true the ambient light is active in the scene.
		 *
		 * Default `true` */
		enabled?: boolean;
		/** The color of the light. Each color component is a number between 0 and 1.
		 *
		 * Default `{ r: 1.0, g: 1.0, b: 1.0 }`
		 */
		color?: Color;
		/** The light intensity.
		 *
		 * Default `1.0` for ambient lights, `2` for others.
		 */
		intensity?: number;
	}
	interface LoaderCommonOptions {
		/** The url to the file.
		 *
		 * Default `''`
		 */
		url?: string;
		/** If true, the model is visible.
		 *
		 * Default `true`
		 */
		visible?: boolean;
		/** The local offset of the model.
		 *
		 * Default `{ x: 0, y: 0, z: 0 }`
		 */
		localPosition?: Vector3;
		/** The local rotation of the model in euler angles.
		 *
		 * Default `{ x: 0, y: 0, z: 0 }`
		 */
		localRotation?: Vector3;
		/** The local scale of the model.
		 *
		 * Default `{ x: 1, y: 1, z: 1 }`
		 */
		localScale?: Vector3;
		/** When set, the collider output is set to the loaded model.
		 *
		 * Default `true`
		 */
		colliderEnabled?: boolean;
	}
	export interface SceneComponentOptions extends Record<SceneComponentName, any> {
		[Component.AMBIENT_LIGHT]: LightComponentCommonOptions;
		[Component.DIRECTIONAL_LIGHT]: LightComponentCommonOptions & {
			/** The world space position of the directional light.
			 *
			 * Default `{ x: 1, y: 5, z: 1}`
			 */
			position?: Vector3;
			/** The directional light’s world space target position.
			 *
			 * Default `{ x: 0, y: 0, z: 0 }`
			 */
			target?: Vector3;
			/** Enables debugging visuals.
			 *
			 * Default `false`
			 */
			debug?: boolean;
		};
		[Component.POINT_LIGHT]: LightComponentCommonOptions & {
			/** The world space position of the point light.
			 *
			 * Default `{ x: 1, y: 5, z: 1 }`
			 */
			position?: Vector3;
			/** Maximum range of the light.
			 *
			 * Default `0` (no limit)
			 */
			distance?: number;
			/** The amount the light dims from the point light.
			 *
			 * Default `1`
			 */
			decay?: number;
			/** Enables debugging visuals.
			 *
			 * Default `false`
			 */
			debug?: boolean;
		};
		[Component.GLTF_LOADER]: LoaderCommonOptions;
		[Component.DAE_LOADER]: LoaderCommonOptions;
		[Component.FBX_LOADER]: LoaderCommonOptions;
		[Component.OBJ_LOADER]: LoaderCommonOptions & {
			/** The url to the material file.
			 *
			 * Default `''`
			 */
			materialUrl?: string;
		};
		[Component.TRANSFORM_CONTROLS]: {
			/** If true the transform control is visible in the scene.
			 *
			 * Default `true`
			 */
			visible?: boolean;
			/** The transformation mode.
			 *
			 * Default `translate`
			 */
			mode?: "translate" | "rotate" | "scale";
			/** The node being controlled by this component.
			 *
			 * Default `null` (hidden)
			 */
			selection?: Scene.INode | null;
			/** X axis control visibility.
			 *
			 * Default `true`
			 */
			showX?: boolean;
			/** Y axis control visibility.
			 *
			 * Default `true`
			 */
			showY?: boolean;
			/** Z axis control visibility.
			 *
			 * Default `true`
			 */
			showZ?: boolean;
			/** The size of the transform control.
			 *
			 * Default `1`
			 */
			size?: number;
		};
		[Component.INPUT]: {
			/** If true, events will be available for binding or spying. If false, no events will fire.
			 *
			 * Default `true`
			 */
			eventsEnabled?: boolean;
			/** If set to false, all showcase user based navigation will be turned off.
			 *
			 * Default `true`
			 */
			userNavigationEnabled?: boolean;
			/** If set to false, the input component will only receive unhandled events.
			 *
			 * Default `true`
			 */
			unfiltered?: boolean;
		};
		[Component.CAMERA]: {
			/** If true, this components acquires control of the camera.
			 *
			 * Default `false`
			 */
			enabled?: boolean;
			/** A three.js camera object.
			 *
			 * Default `null`
			 */
			camera?: THREE.Camera | null;
		};
		[Component.XR]: Record<string, never>;
		[name: string]: unknown;
	}
	export type PredefinedOutputs = {
		/**
		 * Set this to any Object3D and it will be added to the scene.
		 */
		objectRoot: THREE.Object3D | null;
		/**
		 * Set this to any Object3D and it will be interactable. See [[IComponent.onEvent]]
		 */
		collider: THREE.Object3D | null;
	};
	export enum InteractionType {
		/** CLICK events */
		CLICK = "INTERACTION.CLICK",
		/** HOVER events */
		HOVER = "INTERACTION.HOVER",
		/** DRAG events (mousedown then move) */
		DRAG = "INTERACTION.DRAG",
		DRAG_BEGIN = "INTERACTION.DRAG_BEGIN",
		DRAG_END = "INTERACTION.DRAG_END",
		POINTER_MOVE = "INTERACTION.POINTER_MOVE",
		POINTER_BUTTON = "INTERACTION.POINTER_BUTTON",
		SCROLL = "INTERACTION.SCROLL",
		KEY = "INTERACTION.KEY",
		LONG_PRESS_START = "INTERACTION.LONG_PRESS_START",
		LONG_PRESS_END = "INTERACTION.LONG_PRESS_END",
		MULTI_SWIPE = "INTERACTION.MULTI_SWIPE",
		MULTI_SWIPE_END = "INTERACTION.MULTI_SWIPE_END",
		PINCH = "INTERACTION.PINCH",
		PINCH_END = "INTERACTION.PINCH_END",
		ROTATE = "INTERACTION.ROTATE",
		ROTATE_END = "INTERACTION.ROTATE_END"
	}
	/**
	 * The payload for a 3D interaction event.
	 */
	export type InteractionEvent = {
		hover?: boolean;
		collider: THREE.Object3D;
		point: THREE.Vector3 | null;
		normal: THREE.Vector3 | null;
		input: unknown;
	};
	/**
	 * The type of a path with regards to which property of a component it represents
	 */
	export enum PathType {
		INPUT = "input",
		OUTPUT = "output",
		EVENT = "event",
		EMIT = "emit"
	}
	/**
	 * **Scene Node**
	 *
	 * A scene node is an object with a 3D transform: position, rotation, and scale.
	 * It can contain a collection of components and manages their life cycle.
	 *
	 * A scene node has the following states:
	 *
	 * **Initializing** - after construction but before start has been called<br>
	 * **Updating** - after start has been called but before stop has been called<br>
	 * **Destroyed** - after stop has been called
	 *
	 * Components can only be added during the Initializing state. A scene node cannot be restarted.
	 *
	 * ```
	 * sdk.Scene.createNode().then(function(node) {
	 *    node.addComponent('mp.gltfLoader', {
	 *      url: 'http://www.someModelSite.com/rabbit.gltf'
	 *    });
	 *
	 *    node.position.set(0, 1, 0);
	 *    node.start();
	 * });
	 * ```
	 *
	 * Setting the position, rotation, or scale of a scene node affects child components.
	 *
	 */
	export interface INode {
		/**
		 * Instantiates a component and adds it to the nodes internal component list.
		 * This function does nothing if the node is in the Operating or Destroyed state.
		 * @param name The registered component name.
		 * @param initialInputs initial key-value pairs that will be applied to the component before onInit is called.
		 * If the keys do not match the components inputs, they are ignored.
		 * @param id an optional id for this component, if not specified an id will be computed for the component.
		 *
		 * @returns The newly created component.
		 */
		addComponent<T extends SceneComponentName>(name: T, initialInputs?: SceneComponentOptions[T], id?: string): IComponent;
		/**
		 * Returns in iterator iterating over all the components contained by this node.
		 */
		componentIterator(): IterableIterator<IComponent>;
		/**
		 * Transitions the node to Operating if it is in the Initializing state.
		 * Calling this function has no effect if the node is already Operating.
		 */
		start(): void;
		/**
		 * Transitions the node to Destroyed state if it is in any state.
		 * Calling this function has no effect if the node is already Destroyed.
		 */
		stop(): void;
		/**
		 * The node name.
		 */
		name: string;
		/**
		 * The scene node position. You can call methods on this object to set its values.
		 * See <https://threejs.org/docs/#api/en/math/Vector3>
		 */
		readonly position: THREE.Vector3;
		/**
		 * The scene node rotation. You can call methods on this object to set its values.
		 * See <https://threejs.org/docs/#api/en/math/Quaternion>
		 */
		readonly quaternion: THREE.Quaternion;
		/**
		 * The scene node scale vector. You can call methods on this object to set its values.
		 * See <https://threejs.org/docs/#api/en/math/Vector3>
		 */
		readonly scale: THREE.Vector3;
		/**
		 * A read-only unique id used to reference this node in a path binding.
		 * This id is autogenerated unless it is specifed and created via the Scene.Object.
		 */
		readonly id: string;
	}
	/**
	 * **Component Context**<br>
	 * The context object contains the three.js module and the main aspects of the rendering engine.<br>
	 * The camera, scene, or renderer may will likely be replaced in the future with an sdk module.
	 *
	 * ```
	 * function Cylinder() {
	 *    this.onInit = function() {
	 *      var THREE = this.context.three;
	 *      var geometry = new THREE.CylinderGeometry( 5, 5, 20, 32 );
	 *      var material = new THREE.MeshBasicMaterial( {color: 0xffff00} );
	 *      var cylinder = new THREE.Mesh( geometry, material );
	 *    };
	 * }
	 * ```
	 */
	export interface IComponentContext {
		/**
		 * The three.js module.
		 */
		three: typeof THREE;
		/**
		 * The showcase three.js renderer.<br>
		 * See <a href="https://threejs.org/docs/#api/en/renderers/WebGLRenderer" target="_blank">https://threejs.org/docs/#api/en/renderers/WebGLRenderer</a>
		 */
		renderer: THREE.WebGLRenderer;
		/**
		 * The showcase scene.<br>
		 * See <a href="https://threejs.org/docs/#api/en/scenes/Scene" target="_blank">https://threejs.org/docs/#api/en/scenes/Scene</a>
		 *
		 */
		scene: THREE.Scene;
		/**
		 * The main camera. It is read-only.<br>
		 * See <a href="https://threejs.org/docs/#api/en/cameras/Camera" target="_blank">https://threejs.org/docs/#api/en/cameras/Camera</a>
		 */
		camera: THREE.Camera;
	}
	/**
	 * IComponent
	 *
	 * Use this interface to implement a component and register it with the sdk.
	 *
	 * ```
	 * function Box() {
	 *    this.inputs = {
	 *      visible: false,
	 *    };
	 *
	 *    this.onInit = function() {
	 *      var THREE = this.context.three;
	 *      var geometry = new THREE.BoxGeometry(1, 1, 1);
	 *      this.material = new THREE.MeshBasicMaterial();
	 *      var mesh = new THREE.Mesh( geometry, this.material );
	 *      this.outputs.objectRoot = mesh;
	 *    };
	 *
	 *    this.onEvent = function(type, data) {
	 *    }
	 *
	 *    this.onInputsUpdated = function(previous) {
	 *    };
	 *
	 *    this.onTick = function(tickDelta) {
	 *    }
	 *
	 *    this.onDestroy = function() {
	 *      this.material.dispose();
	 *    };
	 * }
  
	 * function BoxFactory() {
	 *    return new Box();
	 * }
	 *
	 * // Registering the component with the sdk
	 * sdk.Scene.register('box', BoxFactory);
	 *
	 * ```
	 */
	export interface IComponent {
		/**
		 * The component type. This value is the same string used to identify the component factory.
		 */
		readonly componentType: string;
		/**
		 * An optional dictionary of properties that affects the behavior of the component.
		 * These properties can be changed by an external source at any time. It is up to the component
		 * to respond appropriately to the changes. These input properties can also be bind targets to an
		 * observable source e.g. the output property of another component.
		 */
		inputs?: Record<string, unknown>;
		/**
		 * An optional dictionary of properties that this component computes.
		 * This dictionary is observable and can be the source of a bind target.
		 *
		 * objectRoot and collider are reserved properties which are added to all components automatically.
		 * The value set to objectRoot will get added to the scene graph as a child of the scene node.
		 * The value set to collider will get included in raycast hit detection.
		 *
		 * ```
		 * function Box() {
		 *    this.onInit = function() {
		 *      var THREE = this.context.three;
		 *      var geometry = new THREE.BoxGeometry(1, 1, 1);
		 *      this.material = new THREE.MeshBasicMaterial();
		 *      var mesh = new THREE.Mesh( geometry, this.material );
		 *
		 *      this.outputs.objectRoot = mesh;   // gets added to the scene node
		 *      this.outputs.collider = mesh;     // will now be part of raycast testing
		 *    }
		 * }
		 * ```
		 */
		outputs: Record<string, unknown> & PredefinedOutputs;
		/**
		 * An optional dictionary of events that this component handles through its `onEvent`.
		 * Setting an event to a falsy value temporarily stops this component from receiving said event.
		 */
		events: Record<string, boolean>;
		/**
		 * An optional dictionary of events emitted by this component.
		 * Setting an emit to a falsy value will prevent the component from emitting the event when using `.notify`.
		 * These properties can be changed by an external source at any time.
		 * If this dictionary is omitted, any and all events will be emitted from `.notify`.
		 */
		emits?: Record<string, boolean>;
		/**
		 * The context provides access to the underlying rendering engine. The sdk framework adds it
		 * to the component during construction.
		 */
		context: IComponentContext;
		/**
		 * This function is called once after the scene node its attached to has started.
		 */
		onInit?(): void;
		/**
		 * This function is called once for each interaction or event that occurred during the last frame.
		 * The component must set outputs.collider with an Object3D to get interaction callbacks or bindEvent to receive other events.
		 */
		onEvent?(eventType: string | InteractionType, eventData?: unknown): void;
		/**
		 * This function is called after one or more input properties have changed.
		 * It will be called at most once a frame.
		 */
		onInputsUpdated?(previousInputs: Record<string, unknown>): void;
		/**
		 *  This function is called once a frame after input changes have been detected.
		 */
		onTick?(tickDelta: number): void;
		/**
		 * This function is called once right before the scene node has stopped.
		 */
		onDestroy?(): void;
		/**
		 * Call this function to bind an input property to an output property on another
		 * component.
		 *
		 * ```
		 * const [sceneObject] = await sdk.Scene.createObjects(1);
		 * const node1 = sceneObject.createNode();
		 * const node2 = sceneObject.createNode();
		 *
		 * // mp.objLoader has an outputs.visible property
		 * const comp1 = node1.addComponent('mp.objLoader');
		 *
		 * // myComponent has an inputs.toggleState property
		 * const comp2 = node2.addComponent('myComponent');
		 *
		 * comp1.bind('visible', comp2, 'toggleState');
		 *
		 * node1.start();
		 * node2.start();
		 *
		 * // comp1.inputs.visible will now always equal comp2.outputs.toggleState
		 * });
		 *
		 * ```
		 * @param prop inputs property name
		 * @param src source component
		 * @param srcProp source outputs property name
		 * @deprecated Use [[IObject.bindPath]] instead.
		 */
		bind(prop: string, src: IComponent, srcProp: string): void;
		/**
		 * Notifies this component of an `eventType` when the `src` Component calls `notify` with a `srcEventType` event
		 * @deprecated Use [[IObject.bindPath]] instead.
		 */
		bindEvent(eventType: string, src: IComponent, srcEventType: string): void;
		/**
		 * Emit an event to other components
		 */
		notify(eventType: string, eventData?: unknown): void;
		/**
		 * Spy on a component's notify from outside of the component system
		 * @returns {ISubscription} an object responsible for removing the spy
		 * @deprecated Use [[IObject.spyOnEvent]] instead.
		 */
		spyOnEvent(spy: IComponentEventSpy): ISubscription;
	}
	/**
	 * A spy that can be attached to be notified of a component events using `spyOnEvent`
	 */
	export interface IComponentEventSpy<T = unknown> {
		/**
		 * The type of event to spy on
		 */
		readonly eventType: string;
		/**
		 * Called when the attached component notifies of an `eventType` event
		 * @param eventData
		 */
		onEvent(eventData?: T): void;
	}
	export interface IComponentDesc {
		name: string;
		factory: () => IComponent;
	}
	/**
	 * A descriptor for an input component property contained by a scene object.
	 */
	export type InputPathDescriptor = {
		/**
		 * The user defined id of the path. This id must be a unique string for the scene object.
		 */
		id: string;
		/**
		 * The type of the path: PathType.INPUT
		 */
		type: PathType.INPUT;
		/**
		 * The parent scene node of the component.
		 */
		node: Scene.INode;
		/**
		 * The component with the property.
		 */
		component: Scene.IComponent;
		/**
		 * The property name of the component.
		 */
		property: string;
	};
	/**
	 * A descriptor for an output component property contained by a scene object.
	 */
	export type OutputPathDescriptor = {
		/**
		 * The user defined id of the path. This id must be a unique string for the scene object.
		 */
		id: string;
		/**
		 * The type of the path: PathType.OUTPUT
		 */
		type: PathType.OUTPUT;
		/**
		 * The parent scene node of the component.
		 */
		node: Scene.INode;
		/**
		 * The component with the property.
		 */
		component: Scene.IComponent;
		/**
		 * The property name of the component.
		 */
		property: string;
	};
	/**
	 * A descriptor for an event component property contained by a scene object.
	 */
	export type EventPathDescriptor = {
		/**
		 * The user defined id of the path. This id must be a unique string for the scene object.
		 */
		id: string;
		/**
		 * The type of the path: PathType.EVENT
		 */
		type: PathType.EVENT;
		/**
		 * The parent scene node of the component.
		 */
		node: Scene.INode;
		/**
		 * The component with the property.
		 */
		component: Scene.IComponent;
		/**
		 * The property name of the component.
		 */
		property: string;
	};
	/**
	 * A descriptor for an emit component property contained by a scene object.
	 */
	export type EmitPathDescriptor = {
		/**
		 * The user defined id of the path. This id must be a unique string for the scene object.
		 */
		id: string;
		/**
		 * The type of the path: PathType.EMIT
		 */
		type: PathType.EMIT;
		/**
		 * The parent scene node of the component.
		 */
		node: Scene.INode;
		/**
		 * The component with the property.
		 */
		component: Scene.IComponent;
		/**
		 * The property name of the component.
		 */
		property: string;
	};
	export interface PathBase {
		/**
		 * The object this path is associated with
		 */
		readonly object: Scene.IObject;
		/**
		 * The id of this path. Set to a random string, or the id provided when creating the path
		 */
		readonly id: string;
	}
	/**
	 * A path to a component's input property
	 */
	export interface InputPath<T = unknown> extends PathBase {
		/**
		 * Get the value of the property associated with this path
		 */
		get(): T;
		/**
		 * Set the value of the property associated with this path
		 * @param newVal
		 */
		set(newVal: T): void;
		/**
		 * Bind this path to an [[OutputPath]]. As the value of the bound output path changes, the value returned by [[get]] will also change
		 * @param outputPath
		 */
		bind(outputPath: OutputPath): void;
	}
	/**
	 * A path to a component's output property
	 */
	export interface OutputPath<T = unknown> extends PathBase {
		/**
		 * Get the value of the property associated with this path
		 */
		get(): T;
		/**
		 * Bind this path to an [[InputPath]]. As the value of this output changes, the value returned by the bound [[InputPath.get]] will also change
		 * @param outputPath
		 */
		bind(inputPath: InputPath): void;
	}
	/**
	 * A path to a component's event property
	 */
	export interface EventPath<T = unknown> extends PathBase {
		/**
		 * Bind this path to an [[EmitPath]].
		 */
		bind(emitPath: EmitPath): void;
		/**
		 * Emit the event associated with this path. This is similar to calling [[IComponent.onEvent]] directly.
		 */
		emit(payload: T): void;
		/**
		 * Disable `this.emit` and the associated Component's `onEvent` from being triggered
		 */
		disable(): void;
		/**
		 * Enable `this.emit` and the associated Component's `onEvent` so it can receive the event again
		 */
		enable(): void;
	}
	/**
	 * A path to a component's emit property
	 */
	export interface EmitPath<T = unknown> extends PathBase {
		/**
		 * Bind this path to an [[EventPath]].
		 */
		bind(eventPath: EventPath): void;
		/**
		 * Emit the event associated with this path. This is similar to [[IComponent.notify]]
		 */
		emit(payload: T): void;
		/**
		 * Disable `this.emit` and the associated Component's `notify`
		 */
		disable(): void;
		/**
		 * Enable `this.emit` and the associated Component's ability to `notify`
		 */
		enable(): void;
	}
	/**
	 * A spy allows for spying on events triggered on a component from outside of the component system
	 */
	export interface ISceneObjectSpy<T = unknown> {
		/**
		 * The path to spy on
		 */
		readonly path: InputPath | OutputPath | EventPath | EmitPath;
		/**
		 * Triggered when the data at `path` changes or when its event is triggered
		 * @param eventData The data sent with event from a [[IComponent.notify]] call or the new value of the input or output referenced by the path.
		 */
		onEvent(eventData: T): void;
	}
	/**
	 * A factory and container for a collection of scene nodes and components connected via property bindings.
	 */
	export interface IObject {
		/**
		 * Adds a scene node to this scene object and returns it. If an id isn't provided, one will be autogenerated.
		 *
		 * @param id a optional unique id
		 *
		 * @return The new scene node.
		 */
		addNode(id?: string): INode;
		/**
		 * Create an array of scene nodes.
		 *
		 * @param nodeCount the number of nodes to create. This value must be greater than zero.
		 *
		 * @return An array of nodes.
		 */
		addNodes(nodeCount: number): INode[];
		/**
		 * Starts all nodes referenced by this scene object.
		 */
		start(): void;
		/**
		 * Stops all nodes referenced by this scene object. The scene object cannot be restarted after this function has been called.
		 */
		stop(): void;
		/**
		 * Call this function to bind an input property of the target component to an output property of the source
		 * component between any nodes contained by this scene object.
		 *
		 * @param targetComponent The component listening to property changes.
		 * @param targetProp  The component input property name.
		 * @param sourceComponent The component broadcasting property changes.
		 * @param sourceProp The component output property name.
		 * @deprecated Use [[IObject.bindPath]] instead.
		 */
		bind(targetComponent: IComponent, targetProp: string, sourceComponent: IComponent, sourceProp: string): void;
		/**
		 * Add a path identified by a unique string.
		 * They `pathDesc.type` will determine which path type is returned.
		 *
		 * @param pathDesc The path descriptor to the component property.
		 * @deprecated Use one of [[addInputPath]], [[addOutputPath]], [[addEventPath]], or [[addEmitPath]]
		 */
		addPath(pathDesc: InputPathDescriptor): InputPath;
		addPath(pathDesc: OutputPathDescriptor): OutputPath;
		addPath(pathDesc: EventPathDescriptor): EventPath;
		addPath(pathDesc: EmitPathDescriptor): EmitPath;
		/**
		 * Add and receive an [[InputPath]] to the property of an [[IComponent]].
		 * The returned [[InputPath]] can be used to read or set the value of `property` on `component`'s inputs.
		 * Changes to the value can also be observed by creating an [[ISceneObjectSpy]] and calling [[spyOnEvent]].
		 * The path can also be bound to an [[OutputPath]] of another (or the same) component to automatically update a component's input value.
		 *
		 * ```typescript
		 *  class Counter {
		 *    public inputs = {
		 *      count: 1,
		 *    };
		 *  }
		 *  // create an `IObject`, add an `INode` and an `IComponent` to the node, see the relevant functions (createObject, addNode, addComponent)
		 *  const [object, node, component];
		 *
		 *  // create the path
		 *  const inputPath = object.addInputPath(component, 'count');
		 *
		 *  // observe changes to the value of `inputs.count` in component
		 *  object.spyOnEvent({
		 *    path: inputPath,
		 *    onEvent(newValue) {
		 *      console.log(`component.input.count's new value is ${newValue}`);
		 *    },
		 *  });
		 *  // read and change the value of the input in the component
		 *  const countValue = inputPath.get();
		 *  inputPath.set(count + 1);
		 *
		 * // bind the path to the value from another (output) path
		 *  object.bindPath(inputPath, outputPath);
		 * ```
		 *
		 * @param component
		 * @param property
		 * @param id
		 * @introduced 3.1.71.14-0-gaf77add383
		 */
		addInputPath(component: IComponent, property: string, id?: string): InputPath;
		/**
		 * Add and receive an [[OutputPath]] to the property of an [[IComponent]].
		 * The returned [[OutputPath]] can be used to read the value of `component`'s output `property`.
		 * Changes to the value can also be observed by creating an [[ISceneObjectSpy]] and calling [[spyOnEvent]].
		 * The path can also be bound to an [[InputPath]] of another (or the same) component to automatically update a component's input value.
		 *
		 * ```typescript
		 *  class NumberGenerator {
		 *    public outputs = {
		 *      current: 1,
		 *    };
		 *  }
		 *  // create an `IObject`, add an `INode` and an `IComponent` to the node, see the relevant functions (createObject, addNode, addComponent)
		 *  const [object, node, component];
		 *
		 *  // create the path
		 *  const outputPath = object.addOutputPath(component, 'current');
		 *
		 *  // observe changes to the value of `outputs.current` in component
		 *  object.spyOnEvent({
		 *    path: outputPath,
		 *    onEvent(newValue) {
		 *      console.log(`component.output.current's new value is ${newValue}`);
		 *    },
		 *  });
		 *  // read and bind the value of the output to another component's input value
		 *  const currentValue = outputPath.get();
		 *  object.bindPath(inputPath, outputPath);
		 * ```
		 *
		 * @param component
		 * @param property
		 * @param id
		 * @introduced 3.1.71.14-0-gaf77add383
		 */
		addOutputPath(component: IComponent, property: string, id?: string): OutputPath;
		/**
		 * Add and receive an [[EventPath]] for an [[IComponent]].
		 * The path can be bound to an [[EmitPath]] of another (or the same) component to automatically trigger the component's [[IComponent.onEvent]].
		 *
		 * ```typescript
		 *  class Renderable {
		 *    public events = {
		 *      rerender: true,
		 *    };
		 *  }
		 *  // create an `IObject`, add an `INode` and an `IComponent` to the node, see the relevant functions (createObject, addNode, addComponent)
		 *  const [object, node, component];
		 *
		 *  // create the path
		 *  const eventPath = object.addEventPath(component, 'rerender');
		 *
		 *  // bind the event path so that it triggers the component's onEvent when `emitPath` emits an event
		 *  object.bindPath(eventPath, emitPath);
		 * ```
		 *
		 * @param component
		 * @param property
		 * @param id
		 * @introduced 3.1.71.14-0-gaf77add383
		 */
		addEventPath(component: IComponent, property: string, id?: string): EventPath;
		/**
		 * Add and receive an [[EmitPath]] for an [[IComponent]].
		 * It is also possible to spy when an event is emitted by creating an [[ISceneObjectSpy]] and calling [[spyOnEvent]].
		 * The path can be bound to an [[EventPath]] of another (or the same) component to automatically trigger the component's [[IComponent.onEvent]].
		 *
		 * ```typescript
		 *  class Clickable {
		 *    public events = {
		 *      clicked: true,
		 *    };
		 *  }
		 *  // create an `IObject`, add an `INode` and an `IComponent` to the node, see the relevant functions (createObject, addNode, addComponent)
		 *  const [object, node, component];
		 *
		 *  // create the path
		 *  const emitPath = object.addEmitPath(component, 'clicked');
		 *
		 *  // bind the emit path so that it triggers the `emitPath`'s associated component's onEvent when an event is emitted
		 *  object.bindPath(eventPath, emitPath);
		 *
		 *  // observe emissions of 'clicked' events in component
		 *  object.spyOnEvent({
		 *    path: emitPath,
		 *    onEvent(eventData) {
		 *      console.log(`a 'clicked' event was emitted with the data: ${eventData}`);
		 *    },
		 *  });
		 * ```
		 *
		 * @param component
		 * @param property
		 * @param id
		 * @introduced 3.1.71.14-0-gaf77add383
		 */
		addEmitPath(component: IComponent, property: string, id?: string): EmitPath;
		/**
		 * Bind the value referenced by `inputPath` to the value of `outputPath`.
		 * As the value at `outputPath` changes, the value of `inputPath` will reflect it.
		 *
		 * ```
		 * const [sceneObject] = await sdk.Scene.createObjects(1);
		 * const node = sceneObject.addNode();
		 *
		 * // mp.objLoader has an outputs.visible property
		 * const comp1 = node.addComponent('mp.objLoader');
		 * const outputPath = sceneObject.addOutputPath(comp1, 'visible', 'objLoader-visible');
		 *
		 * // myComponent has an inputs.toggleState property
		 * const comp2 = node.addComponent('myComponent');
		 * const inputPath = sceneObject.addInputPath(comp2, 'toggleState', 'myComponent-toggle');
		 * sceneObject.bindPath(inputPath, outputPath);
		 *
		 * node.start();
		 * // comp1.inputs.visible will now always equal comp2.outputs.toggleState
		 * ```
		 * @param inputPath
		 * @param outputPath
		 */
		bindPath(inputPath: InputPath, outputPath: OutputPath): void;
		/**
		 * Bind an event referenced by `eventPath` to a [[IComponent.notify]] call at `emitPath`
		 *
		 * ```
		 * const [sceneObject] = await sdk.Scene.createObject(1);
		 * const node = sceneObject.createNode();
		 *
		 * // myReceiver has an `onEvent` lifecycle function and an `events['do.update']` property
		 * const receiver = node.addComponent(`myReceiver');
		 * const eventPath = sceneObject.addEventPath(receiver, 'do.update', 'my-reciever-update');
		 *
		 * // myEmitter calls notify with an 'updated' event and has an `emits['updated']` property
		 * const emitter = node.addComponent('myEmitter');
		 * const emitPath = sceneObject.addEmitPath(emitter, 'updated', 'my-component-updated');
		 * sceneObject.bindPath(eventPath, emitPath);
		 *
		 * node.start();
		 * // receiver.onEvent('do.update', ...) will now be called whenever emitter calls notify('updated')
		 * ```
		 * @param eventPath
		 * @param emitPath
		 */
		bindPath(eventPath: EventPath, emitPath: EmitPath): void;
		/**
		 * Spy on events or input and output value changes
		 *
		 * ```
		 * const [sceneObject] = await sdk.Scene.createObjects(1);
		 * const node = sceneObject.createNode();
		 *
		 * // mp.objLoader has an outputs.visible property
		 * const comp1 = node.addComponent('mp.objLoader');
		 * const outputPath = sceneObject.addOutputPath(comp1, 'visible', 'objLoader-visible');
		 *
		 * const outputSpy = {
		 *   path: outputPath,
		 *   onEvent(type, data) {
		 *     console.log('outputs updated', type, data);
		 *   }
		 * };
		 *
		 * sceneObject.spyOnEvent(outputSpy);
		 *
		 * node.start();
		 * // outputSpy.onEvent('outputsUpdated', comp1.outputs.visible) will now be called whenever comp1.outputs.visible changes
		 * ```
		 * @param spy
		 */
		spyOnEvent(spy: ISceneObjectSpy): ISubscription;
		/**
		 * Sets the input property of a path. The path must be added prior to calling this function.
		 *
		 * @param pathId The path id.
		 * @param value The value to set.
		 * @deprecated Use [[InputPath.set]] instead.
		 */
		setValueAtPath(pathId: string, value: unknown): void;
		/**
		 * Reads the output property of a path. The path must be added prior to calling this function.
		 *
		 * @param pathId
		 * @returns the value of the output property.
		 * @deprecated Use [[InputPath.get]] or [[OutputPath.get]] instead.
		 */
		getValueAtPath(pathId: string): unknown;
		/**
		 * Returns an iterator containing a path and its descriptor. Typically used to access the paths from a deserialized scene object.
		 *
		 * ```
		 * // This example sets the values of all input paths provided by deserialized scene object.
		 *
		 * const deserialized = await sdk.Scene.deserialize(myString);
		 * const paths = deserialized.pathIterator();
		 * for (const { desc, path } of paths) {
		 *   if (desc.type === Scene.PathType.INPUT) {
		 *     // we know this path is an input path
		 *     const inputPath = desc.path as Scene.InputPath;
		 *
		 *     // Now you can set the value at the path
		 *     // You can cache the returned input path to use it later.
		 *     inputPath.set(10);
		 *   }
		 * }
		 * ```
		 */
		pathIterator(): IterableIterator<PathInfo>;
		/**
		 * Returns in iterator iterating over all the nodes contained by this object.
		 */
		nodeIterator(): IterableIterator<INode>;
	}
	/**
	 * The objects returned by the [[pathIterator]] implement this interface. Each descriptor and path should correlate by type.
	 * For example, a path of type [[PathType.INPUT]] would have a descriptor of type [[InputPathDescriptor]] and path of type [[InputPath]].
	 */
	export interface PathInfo {
		desc: InputPathDescriptor | OutputPathDescriptor | EmitPathDescriptor | EventPathDescriptor;
		path: InputPath | OutputPath | EmitPath | EventPath;
	}
	export {};
}
export interface Scene {
	Component: typeof Scene.Component;
	InteractionType: typeof Scene.InteractionType;
	PathType: typeof Scene.PathType;
	/**
	 * This is a convenience function that provides access to three.js framework objects.
	 * Typically used to configure global properties on the renderer or effect composer.
	 *
	 * ```
	 * await sdk.Scene.configure(function(renderer, three, effectComposer){
	 *   // configure PBR
	 *   renderer.physicallyCorrectLights = true;
	 *
	 *   // configure shadow mapping
	 *   renderer.shadowMap.enabled = true;
	 *   renderer.shadowMap.bias = 0.0001;
	 *   renderer.shadowMap.type = three.PCFSoftShadowMap;
	 *
	 *   if (effectComposer) {
	 *     // add a custom pass here
	 *   }
	 * });
	 * ```
	 *
	 * @param callback.renderer Matterport's WebGLRenderer object.
	 * @param callback.three three.js module.
	 * @param callback.effectComposer Matterport's EffectComposer object. This value can be null.
	 * To enable the effect composer, you must set useEffectComposer: 1 in your application config.
	 * Please note that enabling effect composer disables renderer.antialias (&aa=1)
	 *
	 * @bundle
	 */
	configure(callback: (renderer: THREE.WebGLRenderer, three: typeof THREE, effectComposer: EffectComposer | null) => void): Promise<void>;
	/**
	 * Creates a scene node.
	 * @return A promise that resolves with the new scene node.
	 * @deprecated Use [[createObjects]] to create an object to then create nodes instead.
	 *
	 * @bundle
	 */
	createNode(): Promise<Scene.INode>;
	/**
	 * Creates an array of scene nodes.
	 * @param count The number of scene nodes to create.
	 * @return A promise that resolves with the array of scene nodes.
	 * @deprecated Use [[createObjects]] to create an object to then create nodes instead.
	 *
	 * @bundle
	 */
	createNodes(count: number): Promise<Scene.INode[]>;
	/**
	 * Creates an array of scene objects.
	 * @param count The number of scene objects to create.
	 * @return A promise that resolves with the array of scene objects.
	 * ```
	 * // create a single object and destructure it from the returned array
	 * const [sceneObject] = await sdk.Scene.createObjects(1);
	 * const node = sceneObject.createNode();
	 * // ...
	 * ```
	 *
	 * @bundle
	 */
	createObjects(count: number): Promise<Scene.IObject[]>;
	/**
	 * This function returns a scene object with all of its scene nodes from a serialized scene.
	 * The returned scene object has not been started yet.
	 * @param text The serialized scene.
	 * @return A promise that resolves with a scene object.
	 *
	 * @bundle
	 */
	deserialize(text: string): Promise<Scene.IObject>;
	/**
	 * Serialize a scene object, its nodes, and their components to a string.
	 * @param sceneObject
	 * @return A promise that resolves with the serialized string.
	 *
	 * @bundle
	 */
	serialize(sceneObject: Scene.IObject): Promise<string>;
	/**
	 * This function serializes an array of scene nodes and their components to a string.
	 * This function is only provided to provide an upgrade path from nodes that were created before the introduction of `IObject`s.
	 *
	 * @param sceneNodes An array of scene nodes.
	 * @return A promise that resolves with the serialized string.
	 *
	 * @bundle
	 * @deprecated Prefer to serialize an array of `Scene.INode` through their containing `Scene.IObject` instead.
	 */
	serialize(sceneNodes: Scene.INode[]): Promise<string>;
	/**
	 * Register a component factory.
	 * @param name A unique component name.
	 * @param factory A function that returns a new instance of the component.
	 *
	 * @bundle
	 * @return a disposable that can be used to unregister the component.
	 */
	register(name: string, factory: () => Scene.IComponent): Promise<IDisposable | null>;
	/**
	 * Register an array of component factories all at once and return an array of disposables.
	 * Calling dispose on any of the returned disposables, unregisters the component.
	 *
	 *
	 * ```
	 * function myComponent1Factory() {
	 *    return new MyComponent1();
	 * }
	 *
	 * function myComponent2Factory() {
	 *    return new MyComponent2();
	 * }
	 *
	 * const disposables = await sdk.Scene.registerComponents([
	 *   {
	 *     name: 'myComponent1',
	 *     factory: myComponent1Factory,
	 *   },
	 *   {
	 *     name: 'myComponent2',
	 *     factory: myComponent2Factory,
	 *   },
	 * ]);
	 *
	 * // when you are done with the components, you can unregister the components by calling dispose on each item in the return result.
	 * for (const disposable of disposables) {
	 *   disposable.dispose();
	 * }
	 *
	 * ```
	 *
	 * @param components An array of [[IComponentDesc]]
	 * @return an array of disposables that unregister the components when disposed.
	 *
	 * @bundle
	 */
	registerComponents(components: Scene.IComponentDesc[]): Promise<IDisposable[] | null>;
	unregisterComponents(components: Scene.IComponentDesc[]): Promise<void>;
}
declare namespace R3F {
	type ExternalR3FCallbacks = {
		onFrame: () => void;
		onSizeChange: (width: number, height: number) => void;
		onPixelRatioChange: (ratio: number) => void;
	};
	interface IContext {
		/**
		 * The showcase three.js renderer.<br>
		 * See <a href="https://threejs.org/docs/#api/en/renderers/WebGLRenderer" target="_blank">https://threejs.org/docs/#api/en/renderers/WebGLRenderer</a>
		 */
		renderer: THREE.WebGLRenderer;
		/**
		 * The showcase scene.<br>
		 * See <a href="https://threejs.org/docs/#api/en/scenes/Scene" target="_blank">https://threejs.org/docs/#api/en/scenes/Scene</a>
		 *
		 */
		scene: THREE.Scene;
		/**
		 * The main camera. It is read-only.<br>
		 * See <a href="https://threejs.org/docs/#api/en/cameras/Camera" target="_blank">https://threejs.org/docs/#api/en/cameras/Camera</a>
		 */
		camera: THREE.PerspectiveCamera | THREE.OrthographicCamera;
		/**
		 * Function to register a R3F-created mesh with the events system.
		 */
		registerMeshEvents: (obj: THREE.Object3D) => ISubscription;
	}
}
interface R3F {
	/**
	 * Internal: function for `@matterport/r3f` `MatterportViewer` component to register
	 * an externally managed react-three/fiber scene to render within showcase
	 * @experimental
	 */
	registerR3F(callbacks: R3F.ExternalR3FCallbacks): Promise<R3F.IContext>;
	/**
	 * Internal: function for `@matterport/r3f` npm package `MatterportFocusCamera` component
	 * to manage navigation to look at a specific target
	 * @experimental
	 */
	focus(target: THREE.Vector3 | THREE.Box3, options?: {
		from?: THREE.Vector3;
		mode?: Mode.Mode.INSIDE | Mode.Mode.DOLLHOUSE | Mode.Mode.FLOORPLAN;
		transition?: Mode.TransitionType;
	}): Promise<void>;
	/** Request to temporarily block camera controls. */
	controlsToggle(enabled: boolean): Promise<void>;
	/** Request to temporarily block MP's click to navigate functions */
	navigationToggle(enabled: boolean): Promise<void>;
}
/**
 * Options to provide when connecting the sdk
 */
export type ConnectOptions = {
	/** A token to provide access to a model */
	auth: string;
	/**
	 * @hidden
	 */
	provider: string;
	/**
	 * Used for tracking how the sdk is being integrated with other applications.
	 * @hidden
	 */
	sdkType: string;
};
/**
 * The entire MP Sdk returned from a successful call to `MP_SDK.connect` on the [[ShowcaseBundleWindow]].
 *
 * ```typescript
 * const sdk: MpSdk = await bundleWindow.MP_SDK.connect(...);
 * ```
 */
export type MpSdk = CommonMpSdk & {
	Scene: Scene;
	R3F: R3F;
};
/**
 * Provide a single MpSdk namespace that can be used to access all sub-namespace types
 *
 * ```typescript
 * const sdk: Mpsdk = connect(...);
 * const camera: MpSdk.Camera = sdk.Camera;
 * ```
 *
 *  Due to a limitation in typescript, this namespace must be re-created in each file. The
 *  export groupings are created to simplify bookkeeping with the other files.
 */
export declare namespace MpSdk {
	export { Scene, };
	export { Color, ConditionCallback, Dictionary, ICondition, IMapObserver, IObservable, IObservableMap, IObserver, ISubscription, ObserverCallback, Orientation, Rotation, Size, Vector2, Vector3, };
	export { App, Asset, Camera, Conversion, Floor, Graph, Label, Link, Mattertag, Measurements, Mode, Model, OAuth, Pointer, R3F, Renderer, Room, Sensor, Settings, Sweep, Tag, Tour, View, };
}
/**
 * A Window type that can be used to cast the bundle's iframe's contentWindow to hint at the existance of the [[MP_SDK]] object.
 *
 * ```typescript
 * const bundleIframe = document.getElementById<HTMLIFrameElement>('showcase');
 * const showcaseWindow = bundleIframe.contentWindow as ShowcaseBundleWindow;
 * showcaseWindow.MP_SDK.connect(showcaseWindow);
 * ```
 */
export type ShowcaseBundleWindow = ((Window & typeof globalThis) | ShadowRoot) & {
	MP_SDK: MP_SDK;
};
/**
 * The entrypoint for connecting to the SDK and creating an [[MpSdk]] interface.
 *
 * ```typescript
 * const bundleIframe = document.getElementById<HTMLIFrameElement>('showcase');
 * const showcaseWindow = bundleIframe.contentWindow as ShowcaseBundleWindow;
 * showcaseWindow.MP_SDK.connect(showcaseWindow);
 * ```
 */
export interface MP_SDK {
	connect(target: ShowcaseBundleWindow, options?: Partial<ConnectOptions>): Promise<MpSdk>;
}

export {};
