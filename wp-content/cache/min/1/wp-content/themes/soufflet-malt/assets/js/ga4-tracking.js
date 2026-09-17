(function(){'use strict';var config=window.SouffletGA4Config||{};function push(data){window.dataLayer=window.dataLayer||[];window.dataLayer.push(data)}
function pagePath(){return window.location.pathname}
function zoneOf(el){if(el.closest('.site-header')){return'header'}
if(el.closest('.site-footer')){return'footer'}
return'body'}
function textOf(el){var text=(el.textContent||'').replace(/\s+/g,' ').trim();if(text){return text}
text=(el.getAttribute('aria-label')||el.getAttribute('title')||'').trim();if(text){return text}
var image=el.querySelector&&el.querySelector('img[alt]');return image?(image.getAttribute('alt')||'').trim():''}
function normPath(pathname){if(!pathname){return'/'}
return pathname.charAt(pathname.length-1)==='/'?pathname:pathname+'/'}
function isInternalHost(hostname){var hosts=config.internalHosts||[window.location.hostname];var candidate=hostname.toLowerCase().replace(/^www\./,'');return hosts.some(function(host){return String(host||'').toLowerCase().replace(/^www\./,'')===candidate})}
function isSustainabilityHost(hostname){var s=config.sustainability||{};var h=hostname.toLowerCase();return!!s.hostPrefix&&!!s.hostSuffix&&h.indexOf(s.hostPrefix)===0&&h.length>s.hostSuffix.length&&h.indexOf(s.hostSuffix,h.length-s.hostSuffix.length)!==-1}
function slugify(value){return String(value||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'')}
function isWhereToBuyUrl(url,link){if(link.hasAttribute('data-ga4-where-to-buy')){return!0}
var path=normPath(url.pathname);var paths=config.whereToBuyPaths||[];if(paths.indexOf(path)!==-1){return!0}
var targets=config.whereToBuyTargets||[];return targets.some(function(target){var targetPath=normPath(target.path||'');var targetHash=String(target.hash||'').toLowerCase();return path===targetPath&&(!targetHash||url.hash.toLowerCase()===targetHash)})}
var SOUND_TOGGLE_SELECTOR='[data-home-sound-toggle], [data-hp-sound-toggle], [data-tdc-sound-toggle]';var MOMENT_SELECTOR='.timeline-daily-c__segment, .timeline-daily-c__label';var CTA_SELECTOR=['.hero-cta','.figure-cta a','.texte__cta-link','.text-story__cta-link','.text-story__paragraph-cta-link','.basic-text__cta-link','.mt__cta-link','.dm__cta-link','.icons-list__head-link','.graphic-world__cta-btn','.purchase-jumbotron-cta','.jumbotrons-intro-cta','.jumbotron-card__cta','.malt-folders__purchase-btn','.author-quote__cta-link','.posts-archive__cta-link','.news-all-cta','.hscroll-see-all','.hscroll-cta a','.s4-cta a','.s5-cta a','.purchase-malt-cta a','.brand-location__intro-link','.error-404__button','.footer-contact .figure-cta a'].join(', ');var momentState=new WeakMap();var momentsByClock={'07:00':{name:'breakfast',time:'7_am'},'09:00':{name:'morning_coffee',time:'9_am'},'12:00':{name:'lunch',time:'12_pm'},'15:00':{name:'afternoon_break',time:'3_pm'},'16:00':{name:'snack',time:'4_pm'},'18:00':{name:'dinner',time:'6_pm'}};function clockKey(value){var text=String(value||'').trim();var match=text.match(/(\d{1,2})(?:\s*(?::|h)\s*(\d{1,2}))?\s*(am|pm)?/i);if(!match){return''}
var hours=parseInt(match[1],10);var minutes=parseInt(match[2]||'0',10);var period=(match[3]||'').toLowerCase();if(period==='pm'&&hours<12){hours+=12}
if(period==='am'&&hours===12){hours=0}
if(hours>23||minutes>59){return''}
return String(hours).padStart(2,'0')+':'+String(minutes).padStart(2,'0')}
function activeMomentIndex(section){var active=section.querySelector('.timeline-daily-c__label.is-active');return active?active.getAttribute('data-index'):'0'}
function trackMomentActivation(target,interactionType){var section=target.closest('.timeline-daily-c');var index=target.getAttribute('data-index');if(!section||index===null){return}
window.setTimeout(function(){if(activeMomentIndex(section)!==index){return}
var last=momentState.has(section)?momentState.get(section):'0';if(index===last){return}
momentState.set(section,index);var label=section.querySelector('.timeline-daily-c__label[data-index="'+index+'"]');var name=label?textOf(label):'';var rawTime=label?(label.getAttribute('data-time')||''):'';var canonical=momentsByClock[clockKey(rawTime)]||null;push({event:'malt_moment_interaction',moment_name:canonical?canonical.name:slugify(name),moment_time:canonical?canonical.time:slugify(rawTime),interaction_type:interactionType,page_path:pagePath()})},0)}
document.addEventListener('pointerover',function(event){if(event.pointerType!=='mouse'){return}
var target=event.target.closest&&event.target.closest(MOMENT_SELECTOR);if(target){trackMomentActivation(target,'hover')}});document.addEventListener('keydown',function(event){if(['Enter',' ','ArrowRight','ArrowDown','ArrowLeft','ArrowUp'].indexOf(event.key)===-1){return}
var target=event.target.closest&&event.target.closest('.timeline-daily-c__label');var section=target&&target.closest('.timeline-daily-c');var active=section&&section.querySelector('.timeline-daily-c__label.is-active');if(active){trackMomentActivation(active,'click')}});var searchClickSent=!1;document.addEventListener('focusin',function(event){var target=event.target;if(!searchClickSent&&target.closest&&target.closest('.soufflet-search__input')){searchClickSent=!0;push({event:'search_click',page_path:pagePath()})}
trackFormStart(target)});var startedForms=new WeakSet();function trackFormStart(target){if(!target.closest||!target.matches){return}
var isField=target.matches('textarea, select, [contenteditable="true"], input:not([type="submit"]):not([type="button"]):not([type="reset"]):not([type="hidden"])');if(!isField){return}
var form=target.closest('.contact-form form.forminator-custom-form');if(!form||startedForms.has(form)){return}
startedForms.add(form);push({event:'contact_form_start',form_id:String(form.getAttribute('data-form-id')||form.id||'contact-form'),form_name:config.formName||'Contact Form'})}
document.addEventListener('input',function(event){trackFormStart(event.target)});document.addEventListener('change',function(event){trackFormStart(event.target)});function bindForminatorSuccess(){if(typeof window.jQuery!=='function'){return}
window.jQuery(document).on('forminator:form:submit:success',function(event){var form=event.target;if(!form||!form.closest||!form.closest('.contact-form')){return}
push({event:'contact_form_submit_success',form_id:String(form.getAttribute('data-form-id')||form.id||'contact-form'),form_name:config.formName||'Contact Form'})})}
function imageSources(image){return[image.currentSrc,image.getAttribute('src'),image.getAttribute('srcset'),image.getAttribute('data-src'),image.getAttribute('data-srcset'),image.getAttribute('data-lazy-src'),image.getAttribute('data-lazy-srcset')].filter(Boolean).join(' ')}
function trackFlavorWheelOpen(trigger,interactionElement){var targetId=trigger.getAttribute('data-mt-lightbox-target');var lightbox=targetId&&document.getElementById(targetId);if(!lightbox){return!1}
var image=lightbox.querySelector('.mt__lightbox-image');var marker=String(config.flavorWheelMarker||'FLAVOR-WHEEL').toLowerCase();if(!image||imageSources(image).toLowerCase().indexOf(marker)===-1){return!1}
if(!lightbox.classList.contains('is-open')){return!1}
push({event:'flavor_wheel_open',interaction_element:interactionElement||'flavor_wheel',page_path:pagePath()});return!0}
document.addEventListener('keyup',function(event){if(event.key!=='Enter'&&event.key!==' '){return}
var trigger=event.target.closest&&event.target.closest('[data-mt-lightbox-target]');if(trigger){trackFlavorWheelOpen(trigger,'flavor_wheel')}});function onDocumentClick(event){var origin=event.target;if(!origin||!origin.closest){return}
var soundToggle=origin.closest(SOUND_TOGGLE_SELECTOR);if(soundToggle){var muted=soundToggle.classList.contains('is-muted');push({event:'sound_toggle',sound_action:muted?'mute':'unmute',sound_state:muted?'muted':'unmuted',sound_type:'background_sound',page_path:pagePath()});return}
var moment=origin.closest(MOMENT_SELECTOR);if(moment){var isTouch=event.pointerType==='touch'||event.pointerType==='pen'||window.matchMedia('(hover: none)').matches;trackMomentActivation(moment,isTouch?'tap':'click');return}
var lightboxTrigger=origin.closest('[data-mt-lightbox-target]');if(lightboxTrigger){var flavorElement=origin.closest('.mt__zoom-hint')?'zoom_button':'flavor_wheel';trackFlavorWheelOpen(lightboxTrigger,flavorElement);return}
var link=origin.closest('a[href]');if(!link){return}
var href=(link.getAttribute('href')||'').trim();var hrefLower=href.toLowerCase();if(hrefLower.indexOf('tel:')===0){push({event:'phone_click',cta_position:zoneOf(link),page_path:pagePath()});return}
if(hrefLower.indexOf('mailto:')===0){push({event:'email_click',cta_position:zoneOf(link),page_path:pagePath()});return}
var url;try{url=new URL(link.href,window.location.href)}catch(error){return}
if(url.protocol!=='http:'&&url.protocol!=='https:'){return}
var external=!isInternalHost(url.hostname);var isPdf=/\.pdf$/i.test(url.pathname);if(link.matches('a.soufflet-search__link, a.soufflet-search__all')){var searchRoot=link.closest('[data-soufflet-search]');var searchInput=searchRoot&&searchRoot.querySelector('.soufflet-search__input');var searchTerm=searchInput?searchInput.value.trim():'';if(searchTerm){push({event:'internal_search',search_term:searchTerm,page_path:pagePath(),destination_url:link.href})}
return}
if(isPdf&&config.heritageBrand&&link.closest('.malt-folders')){push({event:'heritage_catalog_download',cta_text:textOf(link),heritage_brand:config.heritageBrand,cta_section:catalogSection(link),file_name:url.pathname.split('/').pop(),file_url:link.href,page_path:pagePath()});return}
if(isWhereToBuyUrl(url,link)){push({event:'where_to_buy_click',cta_text:textOf(link),cta_position:zoneOf(link),page_path:pagePath()});return}
if(isSustainabilityHost(url.hostname)){push({event:'sustainability_report_click',cta_text:textOf(link),link_url:link.href,page_path:pagePath()});return}
if(external&&link.closest('.graphic-world__cta')){push({event:'order_online_click',cta_text:textOf(link),page_path:pagePath(),cta_url:link.href,destination_domain:url.hostname.replace(/^www\./,'')});return}
if(external){if(isPdf){return}
push({event:'outbound_link_click',link_text:textOf(link),link_url:link.href,link_domain:url.hostname.replace(/^www\./,''),page_path:pagePath()});return}
if(link.matches(CTA_SELECTOR)){push({event:'cta_click',cta_text:textOf(link),cta_url:link.href,cta_position:zoneOf(link),page_path:pagePath()})}}
function catalogSection(link){var panel=link.closest('.malt-folders__body');var title=panel&&panel.querySelector('.malt-folders__body-title');var tabId=panel&&panel.getAttribute('aria-labelledby');var tab=tabId&&document.getElementById(tabId);var names=[title&&textOf(title),tab&&textOf(tab)].filter(Boolean);for(var i=0;i<names.length;i+=1){var name=slugify(names[i]);if(name.indexOf('base')!==-1){return'base_malts'}
if(name.indexOf('special')!==-1||name.indexOf('speciaux')!==-1){return'specialty_malts'}
if(name.indexOf('range')!==-1||name.indexOf('gamme')!==-1){return'malt_range'}}
return'other'}
document.addEventListener('click',onDocumentClick);var forminatorBound=!1;function tryBindForminatorSuccess(){if(forminatorBound){return}
if(typeof window.jQuery!=='function'){return}
forminatorBound=!0;bindForminatorSuccess()}
tryBindForminatorSuccess();document.addEventListener('DOMContentLoaded',tryBindForminatorSuccess);window.addEventListener('load',tryBindForminatorSuccess)}())