;(function (ko, $) {

	function getWidgetName($element) {
		var tag = $element[0].nodeName.toLowerCase();
		var type = $element.jqmData("type") || $element[0].type;
		var role = $element.jqmData("role");

		// note: jqm uses a select for a on/off toggle so we want to check range before checking select
		if (type === "range" || role === "slider") {
			return "slider";
		}

		if (tag === "select") {
			return "selectmenu";
		}

		if (tag === "button" || type === "button") {
			return "button";
		}

		if (tag === "input") {
			if (type === "checkbox" || type === "radio") {
				return "checkboxradio";
			}

			return "textinput";
		}

		if (tag === "ul" && role === "listview") {
			return "listview";
		}

		return null;
	}

	function canRefresh(widgetName) {
		return widgetName && widgetName !== "textinput";
	}

	function refreshElement(element) {
		// for comment nodes look for parent
		if (element.nodeType === 8) {
			refreshElement(element.parentNode);
		} else {
			var $element = $(element);

			var widgetName = getWidgetName($element);
			if (canRefresh(widgetName)) {
				$element[widgetName]()[widgetName]("refresh");
			} else if ($.mobile.activePage.has(element).length) {
				// if widget not found, trigger create on the page and hope for best
				$.mobile.activePage.trigger("create");
			}
		}
	}

	ko.bindingHandlers["jqmChecked"] = (function() {
		function getValue(element, allBindings) {
			return allBindings.has("checkedValue") ? ko.unwrap(allBindings.get("checkedValue")) : element.value;
		}

		return {
			after: ["attr","value"],
			init: function(element, valueAccessor, allBindings) {
				var modelValue = valueAccessor();

				// if writeable hook into dom event to update model
				if (ko.isWriteableObservable(modelValue)) {
					var handler = function(e) {
						modelValue(e.target.type === "checkbox" ? e.target.checked : getValue(element, allBindings));
					};

					var $element = $(element).on("click", handler);

					// cleanup
			    ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
			        $element.off("click", handler);
			    });
				}
			},
			update: function(element, valueAccessor, allBindings) {
				var value = ko.unwrap(valueAccessor());
				var $element = $(element);

				if (element.type === "checkbox") {
					if ($element.prop("checked") !== value) {
						$element.prop("checked", value);
						refreshElement($element);
					}
				} else {
					var elementValue = getValue(element, allBindings);
					element.checked = value === elementValue;
					refreshElement($element);
				}
			}
		}
	})();

	ko.bindingHandlers["jqmValue"] = {
		after: ["options","foreach"],
		init: function () {
			return ko.bindingHandlers["value"]["init"].apply(this, arguments);
		},
		update: function (element) {
			var output = ko.bindingHandlers["value"]["update"].apply(this, arguments);
			refreshElement(element);
			return output;
		}
	};
	//ko.expressionRewriting.twoWayBindings["jqmValue"] = true;

	ko.bindingHandlers["jqmEnable"] = {
		update: function (element, valueAccessor) {
			var $element = $(element);
			var value = ko.unwrap(valueAccessor());

			var widgetName = getWidgetName($element);
			if (widgetName) {
				$element[widgetName]()[widgetName](value ? "enable" : "disable");
			} else {
				// this may or may not be a widget but applying the 'ui-disabled' class should be sufficient
				// note: there is a bug in jqm with anchors with data-role set to 'button' that causes errors
				// when running 'enable/disable'
				$element
					.prop("disabled", !value)
					.toggleClass("ui-disabled", !value);
			}
		}
	};

	// reverse logic for disabled
	ko.bindingHandlers["jqmDisable"] = {
		update: function (element, valueAccessor) {
			ko.bindingHandlers["jqmEnable"]["update"](element, function() { return !ko.unwrap(valueAccessor()); });
		}
	}

	ko.bindingHandlers["jqmText"] = {
		init: function() {
			return { 'controlsDescendantBindings': true };
		},
		update: function (element, valueAccessor) {
			var value = ko.unwrap(valueAccessor());
			var textElement = $(element).find(".ui-btn-text")[0] || element;
				
			$(textElement).text(value);
		}
	};

	ko.virtualElements.allowedBindings["jqmForeach"] = true;
	ko.bindingHandlers["jqmForeach"] = {
		wrapOptions: function (valueAccessor, element) {
			return function() {
				var modelValue = valueAccessor();
				var unwrapped = ko.utils.peekObservable(modelValue);

				if (!unwrapped || typeof unwrapped.length === "number") {
					return {
						data: modelValue,
						afterRender: function() { refreshElement(element); }
					};
				}

				// wrap afterRender
				var afterRender = unwrapped["afterRender"];
				unwrapped["afterRender"] = function() {
					console.log("after-render");

					// run assigned fn first
					if (afterRender) {
						var fn = ko.unwrap(afterRender);
						fn.apply(this, arguments);
					}

					refreshElement(element);
				};

				return unwrapped;
			};
		},

		init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
			return ko.bindingHandlers["foreach"]["init"].call(this, element, ko.bindingHandlers["jqmForeach"].wrapOptions(valueAccessor, element), allBindings, viewModel, bindingContext);
		},
		update: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
			return ko.bindingHandlers["foreach"]["update"].call(this, element, ko.bindingHandlers["jqmForeach"].wrapOptions(valueAccessor, element), allBindings, viewModel, bindingContext);
		}
	};

	ko.bindingHandlers["vclick"] = {
		init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
			var eventHandler = function (e) {
				var fn = valueAccessor();
				var args, vm, returnValue;

				if (fn) {
					args = $.makeArray(args);
					vm = bindingContext["$data"];

					// ko uses the vm as the first argument for events
					args.unshift(vm);

					returnValue = fn.apply(vm, args) || false;

					// ko cancels events unless overwritten by dev passing true
					if (returnValue !== true) {
						e.preventDefault();
					}

					return returnValue;
				}
			}

			var $element = $(element).on("vclick", eventHandler);

			// cleanup
	    ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
	      $element.off("vclick", eventHandler);
	    });
  	}
	};

})(window.ko, window.jQuery);