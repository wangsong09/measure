import {
    Injector,
    Injectable,
    TemplateRef,
    ViewRef,
    ElementRef,
    EmbeddedViewRef,
    ViewContainerRef,
    ComponentRef,
    ComponentFactory,
    ComponentFactoryResolver
} from '@angular/core';
import { Placement, ConnectionPosition, HorizontalConnectionPos, VerticalConnectionPos, ConnectionPositionPair } from '../util/position';
import { ConnectedPositionStrategy } from '../util/connected-position.strategy';
import { GlobalPositionStrategy } from '../util/global-position.strategy';
import { Subscription } from 'rxjs/Subscription';
import { ViewportRuler } from './scroll-strategy';
import { OverlayComponent } from './overlay';

export class ContentRef {
    constructor(public nodes: any[], public viewRef?: ViewRef, public componentRef?: ComponentRef<any>) { }
}

@Injectable()
export class OverlayPositionService {
    private overlayComponent: any;
    private _contentRef: ContentRef | null;
    private originElement: ElementRef;
    private offsetWhenHasArrow: number = 8;
    originPos: ConnectionPosition;
    overlayPos: ConnectionPosition;
    placement: Placement;
    firstPlacement: string;
    seconedPlacement: string;

    /** Subscription to viewport resize events. */
    _resizeSubscription = Subscription.EMPTY;

    constructor(
        private _viewportRuler: ViewportRuler,
    ) {
    }

    setOverlayRef(overlayRef) {
        this.overlayComponent = overlayRef;
        return this;
    }

    /**
     * Creates a global position strategy.
     */
    global(): GlobalPositionStrategy {
        return new GlobalPositionStrategy();
    }

    /**
     * Creates a relative position strategy.
     * @param elementRef
     * @param originPos
     * @param overlayPos
     */
    attachTo(
        targetRef: ElementRef,
        overlayComponent: any,
        placement): ConnectedPositionStrategy {

            this.splitPlacement(placement);
            this.overlayComponent = overlayComponent;

            const positionStrategy = new ConnectedPositionStrategy(targetRef, this.overlayComponent.el);
            this.withPosition(positionStrategy);
            this.subscribeWindowEvent(positionStrategy);

            return positionStrategy;
    }

    withPosition(positionStrategy) {
        this.withFirstPositon(positionStrategy);
        this.withNextPositon(positionStrategy);
    }

    withFirstPositon(positionStrategy) {
        this.originPos = this.getOriginPosition();
        this.overlayPos = this.getOverlayPosition();
        const {offsetX, offsetY} = this.getOffset();
        positionStrategy.withFallbackPosition(this.originPos, this.overlayPos, offsetX, offsetY);
    }

    withNextPositon(positionStrategy): void {
        const origin = this.getOrigin();
        const overlay = this.getOverlay();
        const {offsetX, offsetY} = this.getOffset(origin.fallback, overlay.fallback);
        positionStrategy.withFallbackPosition(origin.fallback, overlay.fallback, offsetX, offsetY);
    }

    subscribeWindowEvent(positionStrategy) {
        // 不能保存到this上，否则select组件的demo上只定位最后一个
        // 存疑：注入到overlay构造函数中，为什么会共用一个
        // this._resizeSubscription.unsubscribe();
        this._viewportRuler.change().subscribe(() => this.updatePosition(positionStrategy));
    }

    splitPlacement(placement: Placement) {
        this.placement = placement;
        let [firstPlacement, seconedPlacement] = this.placement.split('-');
        this.firstPlacement = firstPlacement;
        this.seconedPlacement = seconedPlacement;
    }

    updatePosition(positionStrategy) {
        positionStrategy.apply(this.positionChangeHandler());
    }

    positionChangeHandler() {
        return (lastConnectedPosition: ConnectionPositionPair) => {
            // 非嵌入的情况下处理溢出反馈
            if (!this.overlayComponent.embedded) {
                this.connectedPositionRevertToPlacement(lastConnectedPosition);
            }
        };
    }

    connectedPositionRevertToPlacement(lastConnectedPosition: ConnectionPositionPair) {
        // 相异的方向为主方向
        if (lastConnectedPosition.targetX !== lastConnectedPosition.overlayX) {
            this.overlayComponent.fallbackFirstPlacement = lastConnectedPosition.targetX;
            this.overlayComponent.placement = lastConnectedPosition.targetX + '-' + lastConnectedPosition.targetY;
        }
        else if (lastConnectedPosition.targetY !== lastConnectedPosition.overlayY) {
            this.overlayComponent.fallbackFirstPlacement = lastConnectedPosition.targetY;
            this.overlayComponent.placement = lastConnectedPosition.targetY + '-' + lastConnectedPosition.targetX;
        }
    }

    getOffset(originPos?: ConnectionPosition, overlayPos?: ConnectionPosition) {
        let offsetX = 0;
        let offsetY = 0;
        if (this.overlayComponent.hasArrow) {

            if (originPos && overlayPos) {
                // 相异为主方向
                if (originPos.vertical !== overlayPos.vertical) {
                    if (originPos.vertical === 'top') {
                        offsetY = -this.offsetWhenHasArrow;
                    }
                    else {
                        offsetY = this.offsetWhenHasArrow;
                    }
                }
                else if (originPos.horizontal !== overlayPos.horizontal) {
                    if (originPos.horizontal === 'left') {
                        offsetX = -this.offsetWhenHasArrow;
                    }
                    else {
                        offsetX = this.offsetWhenHasArrow;
                    }
                }
            }
            else  {
                if (this.firstPlacement === 'left') {
                    offsetX = -this.offsetWhenHasArrow;
                }
                else if (this.firstPlacement === 'right') {
                    offsetX = this.offsetWhenHasArrow;
                }
                else if (this.firstPlacement === 'top') {
                    offsetY = -this.offsetWhenHasArrow;
                }
                else if (this.firstPlacement === 'bottom') {
                    offsetY = this.offsetWhenHasArrow;
                }
            }
        }
        return {offsetX, offsetY};
    }

    getOriginPosition(): ConnectionPosition {

        let horizontal;
        let vertical;
        const firstPlacement = this.firstPlacement;
        const seconedPlacement = this.seconedPlacement;
        if (firstPlacement === 'top' || firstPlacement === 'bottom') {
            vertical = firstPlacement;
        }

        if (firstPlacement === 'left') {
            horizontal = 'left';
        }

        if (firstPlacement === 'right') {
            horizontal = 'right';
        }

        if (seconedPlacement === 'left') {
            horizontal = 'left';
        }

        if (seconedPlacement === 'right') {
            horizontal = 'right';
        }

        if (seconedPlacement === 'top' || seconedPlacement === 'bottom') {
            vertical = seconedPlacement;
        }

        if (seconedPlacement == null) {
            if (firstPlacement === 'top' || firstPlacement === 'bottom') {
                horizontal = 'center';
            }
            else {
                vertical = 'center';
            }
        }

        if (typeof horizontal === 'undefined' || typeof vertical === 'undefined') {
            throw this.getInvalidplacementError(this.placement);
        }

        return {
            horizontal: horizontal,
            vertical: vertical
        };
    }

    getInvalidplacementError(position: string) {
        return Error(`Tooltip position "${position}" is invalid.`);
    }

    getOverlayPosition(): ConnectionPosition {
        const firstPlacement = this.firstPlacement;
        const seconedPlacement = this.seconedPlacement;
        let horizontal;
        let vertical;
        if (firstPlacement === 'top') {
            vertical = 'bottom';
        }
        if (firstPlacement === 'bottom') {
            vertical = 'top';
        }

        if (firstPlacement === 'left') {
            horizontal = 'right';
        }

        if (firstPlacement === 'right') {
            horizontal = 'left';
        }

        if (seconedPlacement === 'left') {
            horizontal = 'left';
        }

        if (seconedPlacement === 'right') {
            horizontal = 'right';
        }

        if (seconedPlacement === 'top' || seconedPlacement === 'bottom') {
            vertical = seconedPlacement;
        }

        if (seconedPlacement == null) {
            if (firstPlacement === 'top' || firstPlacement === 'bottom') {
                horizontal = 'center';
            }
            else {
                vertical = 'center';
            }
        }

        if (typeof horizontal === 'undefined' || typeof vertical === 'undefined') {
            throw this.getInvalidplacementError(this.placement);
        }

        return {
            horizontal: horizontal,
            vertical: vertical
        };
    }

    /**
     * Returns the origin position and a fallback position based on the user's position preference.
     * The fallback position is the inverse of the origin (e.g. 'below' -> 'above').
     */
    getOrigin(): { main: ConnectionPosition, fallback: ConnectionPosition } {
        const { x, y } = this.invertPosition(this.originPos.horizontal, this.originPos.vertical);

        return {
            main: this.originPos,
            fallback: { horizontal: x, vertical: y }
        };
    }

    /** Returns the overlay position and a fallback position based on the user's preference */
    getOverlay(): { main: ConnectionPosition, fallback: ConnectionPosition } {
        const { x, y } = this.invertPosition(this.overlayPos.horizontal, this.overlayPos.vertical);

        return {
            main: this.overlayPos,
            fallback: { horizontal: x, vertical: y }
        };
    }

    /** Inverts an overlay position. */
    invertPosition(x: HorizontalConnectionPos, y: VerticalConnectionPos) {
        if (this.firstPlacement === 'top' || this.firstPlacement === 'bottom') {
            if (y === 'top') {
                y = 'bottom';
            } else if (y === 'bottom') {
                y = 'top';
            }
        } else {
            if (x === 'right') {
                x = 'left';
            } else if (x === 'left') {
                x = 'right';
            }
        }

        return { x, y };
    }
}
