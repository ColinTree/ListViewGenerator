package __fullPackage__;

import java.lang.reflect.*;
import java.util.ArrayList;

import com.google.appinventor.components.annotations.*;
import com.google.appinventor.components.common.*;
import com.google.appinventor.components.runtime.*;
import com.google.appinventor.components.runtime.util.YailList;

import android.content.Context;
import android.util.Log;
import android.view.View;
import android.view.View.OnClickListener;

@DesignerComponent(version = __componentName__.VERSION,
    description = "__description__",
    category = ComponentCategory.EXTENSION,
    nonVisible = true)
@SimpleObject(external = true)
public class __componentName__ extends AndroidNonvisibleComponent {

    public static final String LOG_TAG = "__componentName__";
    public static final int VERSION = __version__;

    /*_propertyDefaultValueStart_*/
    private static final _type_ DEFAULT__name_ = _defaultValue_;
    /*_propertyDefaultValueEnd_*/

    private final Context context;
    private final Form form;

    private final ArrayList<Element> elementList = new ArrayList<Element>();
    private HVArrangement vaContainer;
    private int currentListSize = 0;

    /*_propertyFieldStart_*/
    private _type_ _name_ = DEFAULT__name_;
    /*_propertyFieldEnd_*/

    public __componentName__(ComponentContainer container) {
        super(container.$form());
        Log.d(LOG_TAG, LOG_TAG + " Created");

        this.context = container.$context();
        this.form = container.$form();
    }

    @SimpleFunction
    public void Initialize(VerticalArrangement verticalArrangement) {
        vaContainer = verticalArrangement;
        vaContainer.AlignHorizontal(ComponentConstants.GRAVITY_CENTER_HORIZONTAL);
    }
    @SimpleFunction
    public void Initialize_Scroll(VerticalScrollArrangement verticalScrollArrangement) {
        vaContainer = verticalScrollArrangement;
        vaContainer.AlignHorizontal(ComponentConstants.GRAVITY_CENTER_HORIZONTAL);
    }

    @SimpleFunction
    public void Clear() {
        Set(YailList.makeEmptyList());
    }

    @SimpleFunction
    public void Set(YailList list) {
        int size = list.size();
        Object sublistElement;
        for (int i=0; i<size; i++) {
            sublistElement = list.getObject(i);
            if (sublistElement instanceof YailList) {
                if (currentListSize > i) {
                    SetElement(i+1, (YailList)sublistElement);
                    //call the function that is shown in bky, so the index start from 1
                } else {
                    AddElement((YailList)sublistElement);
                }
            } else {
                //TODO: if allowing a non-YailList object as an list item, add here
            }
        }
        // hide the elements that is created but not uesd
        for (int i=list.size(); i<currentListSize; i++) {
            elementList.get(i).hide();
        }
        currentListSize = list.size();
    }
    private YailList getYailList(Object... obj) {
        return YailList.makeList(obj);
    }

    @SimpleFunction
    public void AddElement(YailList elementData) {
        int elementListSize = elementList.size();
        if (currentListSize<elementListSize && elementListSize>0) {
            Element ele = elementList.get(currentListSize);
            ele.show();
            ele.set(elementData);
        } else {
            final int elementIndex = currentListSize;
            elementList.add(new Element(vaContainer, elementData) {
                @Override
                public void onElementClick() {
                    ElementClick(elementIndex);
                }
                /*_eventImplementStart_*/
                @Override
                public void on_name_() {
                    _name_(elementIndex);
                }
                /*_eventImplementEnd_*/
            });
        }
        currentListSize++;
    }
    @SimpleFunction
    public void AddEmptyElement() {
        AddElement(YailList.makeEmptyList());
    }

    @SimpleFunction
    public void SetElement(int elementIndex, YailList element) {
        if (elementIndex<1 || elementIndex>currentListSize) {
            return;
        }
        Element ele = elementList.get(elementIndex-1);
        ele.show();
        ele.set(element);
    }
    @SimpleFunction
    public void SetElementText(int elementIndex, String text) {
        if (elementIndex<1 || elementIndex>currentListSize) {
            return;
        }
        elementList.get(elementIndex-1).setText(text);
    }
    @SimpleFunction
    public YailList GetElement(int elementIndex) {
        return YailList.makeList(getElementWithObject(elementIndex));
    }
    public Object[] getElementWithObject(int elementIndex) {
        Element element = elementList.get(elementIndex-1);
        //TODO: implement this
        return new Object[0];
    }

    @SimpleFunction
    public void RemoveElement(int elementIndex) {
        if (elementIndex<1 || elementIndex>currentListSize) {
            return;
        }
        for (int i=elementIndex-1; i<currentListSize-1; i++) {
            copyElement(i+1,i);
        }
        elementList.get(currentListSize-1).hide();
        currentListSize--;
    }
    private void copyElement(int indexFrom, int indexTo) {
        SetElement(
            indexTo+1, 
            getYailList(GetElement(indexFrom+1).toArray())
            // trun into object[] first, avoiding reference confusing. (create a new object)
        );
    }


    @SimpleEvent(description = "Element is clicked")
    public void ElementClick(int elementIndex) {
        EventDispatcher.dispatchEvent(this, "ElementClick", 1+elementIndex);
    }
    /*_eventStart_*/
    @SimpleEvent(description = "_description_")
    public void _name_(int elementIndex) {
        EventDispatcher.dispatchEvent(this, "_name_", 1+elementIndex);
    }
    /*_eventEnd_*/

    
    /*_propertyStart_*/
    @SimpleProperty(description = "_description_", category = PropertyCategory._category_, userVisible = _setterVisible_)
    _if_designerVisible_@DesignerProperty(editorType = "_editorType_", defaultValue = "" + DEFAULT__name_, editorArgs = _args_)
    public void _name_(_type_ _name_) {
        this._name_ = _name_;
        refreshElementProperties();
    }
    @SimpleProperty(description = "_description_", category = PropertyCategory._category_, userVisible = _getterVisible_)
    public _type_ _name_() {
        return _name_;
    }
    /*_propertyEnd_*/

    private void refreshElementProperties() {
        for (int i=0; i<currentListSize; i++) {
            elementList.get(i).refreshProperties();
        }
    }




    private class Element implements OnClickListener {
        private ComponentContainer container;
        /*_elementComponentStart_*/
        private _type_ _name_;/*_elementComponentEnd_*/

        public Element(ComponentContainer container, YailList list) {
            this.container = container;
            create();
            set(list);
        }

        public void onElementClick() {}
        /*_elementEventStart_*/
        public void on_name_() {}
        /*_elementEventEnd_*/

        @Override
        public void onClick(View view) {
            onElementClick();
        }

        private void create() {
            /*_elementCreate_*/
            refreshProperties();
        }
        public void refreshProperties() {
            show();
            /*_elementRefreshProperties_*/
        }

        private void setProperty(AndroidViewComponent component, String propName, String propValue) {
            Class<?> claz = component.getClass();
            Method[] methods = claz.getMethods();
            Method setter = null;
            for (Method method : methods) {
                if (method.getName().equals(propName) && method.getParameterCount() == 1) {
                    setter = method;
                    break;
                }
            }
            // May be null
            Parameter param = setter.getParameters()[0];
            try {
                if (param.getType() == String.class) {
                    setter.invoke(component, propValue);
                } else if (param.getType() == Boolean.TYPE) {
                    setter.invoke(component, Boolean.getBoolean(propValue));
                } else if (param.getType() == Integer.TYPE) {
                    setter.invoke(component, Integer.parseInt(propValue));
                } else if (param.getType() == Float.TYPE) {
                    setter.invoke(component, Float.parseFloat(propValue));
                } else if (param.getType() == Double.TYPE) {
                    setter.invoke(component, Double.parseDouble(propValue));
                } else {
                /* TODO:
                 * java.lang.Character#TYPE
                 * java.lang.Byte#TYPE
                 * java.lang.Short#TYPE
                 * java.lang.Long#TYPE
                 * java.lang.Void#TYPE
                 */
                    throw new IllegalArgumentException("Cannot cast property into target type of property \"" + propName + "\". "
                                                    + "Require " + param.getType().getName() + ", get \"" + propValue + "\"");
                }
            } catch (IllegalAccessException | InvocationTargetException e) {
                throw new IllegalArgumentException(e);
            }
        }

        public void show() {
            /*_elementShow_*/
        }
        public void hide() {
            /*_elementHide_*/
        }

        public void setText(String text) {
            /*_elementSetText_*/
        }
        public String getText() {
            /*_elementSetText_*/
            return "";
        }

        public void set(YailList list) {
            int size=list.toArray().length;
            /*_elementSet_*/
        }
    }

}